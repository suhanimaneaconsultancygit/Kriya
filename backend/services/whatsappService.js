const twilio = require("twilio");

// Initialize Twilio client from environment variables (never hardcode credentials)
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

/**
 * Send a WhatsApp task-assignment notification to a user via Twilio Content API.
 *
 * @param {Object} user       - The assignee (Mongoose User document)
 * @param {Object} task       - The task being assigned (Mongoose Task document)
 * @param {Object} assignedBy - The user who created/assigned the task
 */
const sendWhatsAppMessage = async (user, task, assignedBy) => {
  // Guard: no phone number saved → skip silently
  if (!user.phoneNumber) {
    console.log(`[WhatsApp] Skipping — no phone number for user: ${user.name}`);
    return;
  }

  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_WHATSAPP_NUMBER,           // e.g. whatsapp:+14155238886
      to:   `whatsapp:${user.phoneNumber}`,                // e.g. whatsapp:+919876543210
      contentSid: process.env.TWILIO_CONTENT_SID,          // pre-approved template SID
      contentVariables: JSON.stringify({
        1: user.name,                                        // recipient name
        2: task.title,                                       // task title
        3: assignedBy.name,                                  // assigned-by name
        4: task.priority  || "medium",                       // priority
        5: task.dueDate
          ? new Date(task.dueDate).toLocaleDateString("en-IN", {
              day: "2-digit", month: "short", year: "numeric",
            })
          : "No deadline",                                   // human-readable deadline
      }),
    });

    console.log(`[WhatsApp] ✅ Message sent to ${user.phoneNumber} — SID: ${message.sid}`);
  } catch (err) {
    // Log the error but never crash the main request flow
    console.error(`[WhatsApp] ❌ Failed to send to ${user.phoneNumber}:`, err.message);
  }
};

module.exports = { sendWhatsAppMessage };
