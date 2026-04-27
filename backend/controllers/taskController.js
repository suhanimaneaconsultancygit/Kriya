const Task = require("../models/Task");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { sendWhatsAppMessage } = require("../services/whatsappService");

const createAssignmentNotification = async ({ recipientId, actorId, type, task, message, meta = {} }) => {
  if (!recipientId) return;
  if (recipientId.toString() === String(actorId)) return;

  await Notification.create({
    recipient: recipientId,
    actor: actorId || null,
    type,
    title: task.title,
    message,
    task: task._id,
    meta,
  });
};

// ─── NEW SIMPLE PERMISSION RULES ─────────────────────────────────────────────
// • admin, sub_admin, team_lead, member → can assign to ANYONE except interns
// • intern → can only assign to other interns (or self)
// • Everyone can reassign tasks they created or were assigned to
//   (except interns can only reassign within interns)

const canAssignTo = (assigner, target) => {
  if (assigner.role === "intern") {
    // interns → only other interns or themselves
    return target.role === "intern";
  }
  // everyone else → anyone in the system
  return true;
};

const canReassignTask = (user, task) => {
  const isCreator  = task.assignedBy._id?.toString() === user._id.toString() ||
                     task.assignedBy.toString()       === user._id.toString();
  const isAssignee = task.assignedTo._id?.toString() === user._id.toString() ||
                     task.assignedTo.toString()       === user._id.toString();
  return isCreator || isAssignee || ["admin", "sub_admin"].includes(user.role);
};

// GET /api/tasks  — everyone sees tasks they created OR are assigned to
const getTasks = async (req, res) => {
  try {
    const { status, priority, team, search } = req.query;

    // Visibility: task is visible to BOTH the assigner AND the assignee
    let query = {
      $or: [
        { assignedTo: req.user._id },
        { assignedBy: req.user._id },
      ],
    };

    // Admin / sub_admin see ALL tasks
    if (["admin", "sub_admin"].includes(req.user.role)) {
      query = {};
    }

    if (status)   query.status   = status;
    if (priority) query.priority = priority;
    if (team && ["admin", "sub_admin"].includes(req.user.role)) query.team = team;
    if (search)   query.title    = { $regex: search, $options: "i" };

    const tasks = await Task.find(query)
      .populate("assignedTo", "name email role team avatar")
      .populate("assignedBy", "name email role avatar")
      .populate("reassignmentHistory.fromUser",     "name avatar")
      .populate("reassignmentHistory.toUser",       "name avatar")
      .populate("reassignmentHistory.reassignedBy", "name avatar")
      .sort({ createdAt: -1 });

    res.json({ success: true, count: tasks.length, tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tasks/stats
const getStats = async (req, res) => {
  try {
    let matchQuery = {};
    if (!["admin", "sub_admin"].includes(req.user.role)) {
      matchQuery.$or = [
        { assignedTo: req.user._id },
        { assignedBy: req.user._id },
      ];
    }

    const [statusStats, teamStats] = await Promise.all([
      Task.aggregate([{ $match: matchQuery }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
      Task.aggregate([{ $match: {} }, { $group: { _id: "$team", total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ["$status", "done"] }, 1, 0] } } } }]),
    ]);

    const total   = await Task.countDocuments(matchQuery);
    const overdue = await Task.countDocuments({ ...matchQuery, dueDate: { $lt: new Date() }, status: { $ne: "done" } });

    res.json({ success: true, stats: { total, overdue, byStatus: statusStats, byTeam: teamStats } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/tasks/:id
const getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name email role team avatar")
      .populate("assignedBy", "name email role avatar");
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/tasks  — create task (with optional voice note)
const createTask = async (req, res) => {
  try {
    const { title, description, assignedTo, team, status, priority, dueDate, voiceNote, voiceNoteDuration } = req.body;

    if (!title || !assignedTo || !team || !dueDate) {
      return res.status(400).json({ success: false, message: "Title, assignedTo, team, and dueDate are required." });
    }

    const targetUser = await User.findById(assignedTo);
    if (!targetUser) return res.status(404).json({ success: false, message: "Assigned user not found." });

    if (!canAssignTo(req.user, targetUser)) {
      return res.status(403).json({ success: false, message: "Interns can only assign tasks to other interns." });
    }

    const task = await Task.create({
      title, description,
      voiceNote:         voiceNote || null,
      voiceNoteDuration: voiceNoteDuration || null,
      assignedTo,
      assignedBy: req.user._id,
      team,
      status:   status   || "todo",
      priority: priority || "medium",
      dueDate,
      statusHistory: [{ status: status || "todo", changedBy: req.user._id, note: "Task created" }],
    });

    const populated = await Task.findById(task._id)
      .populate("assignedTo", "name email role team avatar")
      .populate("assignedBy", "name email role avatar");

    await createAssignmentNotification({
      recipientId: populated.assignedTo?._id || assignedTo,
      actorId: req.user._id,
      type: "task_assigned",
      task: populated,
      message: `${req.user.name} assigned you a task.`,
      meta: { assignedByName: req.user.name },
    });

    // ─── WHATSAPP NOTIFICATION ────────────────────────────────────────────
    // Fetch the full assignee doc to check opt-in and phoneNumber
    const assigneeUser = await User.findById(assignedTo);
    if (assigneeUser && assigneeUser.phoneNumber && assigneeUser.whatsappOptIn === true) {
      await sendWhatsAppMessage(assigneeUser, populated, req.user);
    }

    res.status(201).json({ success: true, message: "Task created!", task: populated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/tasks/:id  — update task details or status
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name role _id")
      .populate("assignedBy", "name role _id");
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });

    const { title, description, team, status, priority, dueDate, statusNote } = req.body;

    const isCreator  = task.assignedBy._id.toString() === req.user._id.toString();
    const isAssignee = task.assignedTo._id.toString() === req.user._id.toString();
    const isSuperior = ["admin", "sub_admin"].includes(req.user.role);

    // Anyone involved (creator or assignee) or admin can update
    if (!isCreator && !isAssignee && !isSuperior) {
      return res.status(403).json({ success: false, message: "You don't have permission to edit this task." });
    }

    // Status update — both creator and assignee can change status
    if (status && status !== task.status) {
      task.statusHistory.push({
        status,
        changedBy: req.user._id,
        changedAt: new Date(),
        note: statusNote || `Status changed to ${status}`,
      });
      task.status = status;
    }

    // Full edit — creator or admin can edit all fields
    if (isCreator || isSuperior) {
      if (title !== undefined)       task.title       = title;
      if (description !== undefined) task.description = description;
      if (team)                      task.team        = team;
      if (priority)                  task.priority    = priority;
      if (dueDate)                   task.dueDate     = dueDate;
    }

    await task.save();

    const updated = await Task.findById(task._id)
      .populate("assignedTo", "name email role team avatar")
      .populate("assignedBy", "name email role avatar");

    res.json({ success: true, message: "Task updated!", task: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// PUT /api/tasks/:id/reassign  — reassign task to someone else
const reassignTask = async (req, res) => {
  try {
    const { newAssigneeId, note } = req.body;
    if (!newAssigneeId) return res.status(400).json({ success: false, message: "newAssigneeId is required." });

    const task = await Task.findById(req.params.id)
      .populate("assignedTo", "name role _id")
      .populate("assignedBy", "name role _id");
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });

    // Check permission to reassign
    if (!canReassignTask(req.user, task)) {
      return res.status(403).json({ success: false, message: "Only the task creator, assignee, or admin can reassign this task." });
    }

    const newAssignee = await User.findById(newAssigneeId);
    if (!newAssignee) return res.status(404).json({ success: false, message: "New assignee not found." });

    // Intern restriction: interns can only reassign to other interns
    if (req.user.role === "intern" && newAssignee.role !== "intern") {
      return res.status(403).json({ success: false, message: "Interns can only reassign tasks to other interns." });
    }

    // Record reassignment history
    task.reassignmentHistory.push({
      fromUser:     task.assignedTo._id,
      toUser:       newAssigneeId,
      reassignedBy: req.user._id,
      reassignedAt: new Date(),
      note:         note || `Reassigned by ${req.user.name}`,
    });

    task.assignedTo = newAssigneeId;

    // Add status history note
    task.statusHistory.push({
      status:    task.status,
      changedBy: req.user._id,
      changedAt: new Date(),
      note:      `Task reassigned to ${newAssignee.name}`,
    });

    await task.save();

    const updated = await Task.findById(task._id)
      .populate("assignedTo", "name email role team avatar")
      .populate("assignedBy", "name email role avatar")
      .populate("reassignmentHistory.fromUser",     "name avatar")
      .populate("reassignmentHistory.toUser",       "name avatar")
      .populate("reassignmentHistory.reassignedBy", "name avatar");

    await createAssignmentNotification({
      recipientId: updated.assignedTo?._id || newAssigneeId,
      actorId: req.user._id,
      type: "task_reassigned",
      task: updated,
      message: `${req.user.name} reassigned a task to you.`,
      meta: { assignedByName: req.user.name, previousAssigneeName: task.assignedTo?.name || null },
    });

    // ─── WHATSAPP NOTIFICATION ────────────────────────────────────────────
    if (newAssignee.phoneNumber && newAssignee.whatsappOptIn === true) {
      await sendWhatsAppMessage(newAssignee, updated, req.user);
    }

    res.json({ success: true, message: `Task reassigned to ${newAssignee.name}!`, task: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// DELETE /api/tasks/:id
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: "Task not found." });

    const isCreator  = task.assignedBy.toString() === req.user._id.toString();
    const isAssignee = task.assignedTo.toString() === req.user._id.toString();
    const isSuperior = ["admin", "sub_admin"].includes(req.user.role);

    if (!isCreator && !isAssignee && !isSuperior) {
      return res.status(403).json({ success: false, message: "You don't have permission to delete this task." });
    }

    await task.deleteOne();
    res.json({ success: true, message: "Task deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, reassignTask, deleteTask, getStats };
