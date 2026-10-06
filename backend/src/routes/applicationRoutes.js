const express = require("express");
const { requireAuth } = require("../middleware/auth");
const {
  createApplication,
  listApplications,
  updateApplicationStatus,
} = require("../controllers/applicationController");

const router = express.Router();

router.get("/", listApplications);
router.post("/", requireAuth ,  createApplication);
router.patch("/:id/status",requireAuth ,  updateApplicationStatus);

module.exports = router;
