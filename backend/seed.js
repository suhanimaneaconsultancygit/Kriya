const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const dotenv   = require("dotenv");
dotenv.config();

const User   = require("./models/User");
const Task   = require("./models/Task");
const Report = require("./models/Report");

const hash = async (plain) => bcrypt.hash(plain, 10);

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB Atlas");

    await User.deleteMany({});
    await Task.deleteMany({});
    await Report.deleteMany({});
    console.log("🗑️ Cleared existing data");

    // USERS (FIXED)
    const usersRaw = [
      { name: "Amey Pangarkar", email: "admin@taskflow.com", password: "Admin@1234", role: "admin", team: null },

      { name: "Prasad Kulkarni", email: "prasad@taskflow.com", password: "prasad123", role: "sub_admin", team: null },

      { name: "Tanvi Amberkar", email: "tanvi@taskflow.com", password: "tanvi123", role: "team_lead", team: "Marketing" },

      { name: "Jay Gondkar", email: "jay@taskflow.com", password: "jay123", role: "team_lead", team: "Designing" },

      { name: "Nikhil Patil", email: "nikhil@taskflow.com", password: "nikhil123", role: "team_lead", team: "Marketing" },

      { name: "Rahul Desai", email: "rahul@taskflow.com", password: "rahul123", role: "member", team: "SEO" },

      { name: "Vijay Devkar", email: "vijay@taskflow.com", password: "vijay123", role: "member", team: "Web Development" },

      { name: "Amit Verma", email: "amit@taskflow.com", password: "amit123", role: "intern", team: "Interns" }
    ];

    // HASH PASSWORDS
    const usersData = await Promise.all(
      usersRaw.map(async (u) => ({
        ...u,
        email: u.email.toLowerCase(),
        password: await hash(u.password),
        avatar: u.name.split(" ").map(w => w[0]).join("").toUpperCase(),
        isActive: true,
      }))
    );

    const users = await User.insertMany(usersData);
    console.log(`👥 Created ${users.length} users`);

    // MAP USERS
    const u = {};
    users.forEach(user => {
      u[user.email.split("@")[0]] = user._id;
    });

    const addDays = (days) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return d;
    };

    // TASKS (FIXED USERS)
    const tasksData = [
      {
        title: "Landing Page Design",
        description: "Create homepage UI",
        assignedTo: u.vijay,
        assignedBy: u.admin,
        team: "Web Development",
        status: "in_progress",
        priority: "high",
        dueDate: addDays(5)
      },
      {
        title: "Social Media Campaign",
        description: "Instagram marketing",
        assignedTo: u.tanvi,
        assignedBy: u.prasad,
        team: "Marketing",
        status: "todo",
        priority: "urgent",
        dueDate: addDays(4)
      },
      {
        title: "SEO Optimization",
        description: "Improve ranking",
        assignedTo: u.rahul,
        assignedBy: u.prasad,
        team: "SEO",
        status: "in_progress",
        priority: "medium",
        dueDate: addDays(10)
      },
      {
        title: "UI Design System",
        description: "Create design tokens",
        assignedTo: u.jay,
        assignedBy: u.admin,
        team: "Designing",
        status: "review",
        priority: "high",
        dueDate: addDays(3)
      }
    ];

    const tasks = await Task.insertMany(
      tasksData.map(t => ({
        ...t,
        tags: [],
        statusHistory: [
          { status: t.status, changedBy: t.assignedBy, note: "Created" }
        ]
      }))
    );

    console.log(`📋 Created ${tasks.length} tasks`);

    // REPORTS
    const today = new Date().toISOString().slice(0, 10);

    const reports = await Report.insertMany([
      {
        user: u.vijay,
        date: today,
        mood: "good",
        summary: "Worked on frontend UI",
        workData: { hoursWorked: 7 }
      },
      {
        user: u.tanvi,
        date: today,
        mood: "great",
        summary: "Planned marketing strategy",
        workData: { hoursWorked: 8 }
      }
    ]);

    console.log(`📝 Created ${reports.length} reports`);

    console.log("\n🎉 SEED SUCCESSFUL\n");

    process.exit(0);

  } catch (err) {
    console.error("❌ Seed failed:", err.message);
    process.exit(1);
  }
};

seed();