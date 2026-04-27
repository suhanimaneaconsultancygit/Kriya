const express = require("express");
const router = express.Router();
const { getUsers, getAssignableUsers, getTeamStructure, getUserTasks, getUser, updateProfile, updateWhatsAppSettings } = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

router.use(protect);

router.get("/",               getUsers);
router.get("/assignable",     getAssignableUsers);
router.get("/team-structure", getTeamStructure);
router.get("/:id/tasks",      getUserTasks);
router.get("/:id",            getUser);
router.put("/profile",        updateProfile);
router.put("/whatsapp-settings", updateWhatsAppSettings);

module.exports = router;
