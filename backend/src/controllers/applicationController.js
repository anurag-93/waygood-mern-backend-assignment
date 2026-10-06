
const Program = require("../models/Program");
const University = require("../models/University");
const { validStatusTransitions } = require("../config/constants");

const Application = require("../models/Application");
const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

const listApplications = asyncHandler(async (req, res) => {
  const { studentId, status } = req.query;
  const filters = {};

  if (studentId) {
    filters.student = studentId;
  }

  if (status) {
    filters.status = status;
  }

  const applications = await Application.find(filters)
    .populate("student", "fullName email role")
    .populate("program", "title degreeLevel tuitionFeeUsd")
    .populate("university", "name country city")
    .sort({ createdAt: -1 })
    .lean();

  res.json({
    success: true,
    data: applications,
  });
});

// Create a new program application for the authenticated student.
// Validates the program, intake, and duplicate application before creation.

const createApplication = asyncHandler(async (req, res) => {
  const { programId, intake } = req.body;

  if (!programId || !intake) {
    throw new HttpError(400, "Program ID and intake are required.");
  }
// Load the selected program to validate that it exists
// and obtain its university and available intakes.
  const program = await Program.findById(programId).lean();

  if (!program) {
    throw new HttpError(404, "Program not found.");
  }

  const university = await University.findById(program.university).lean();

  if (!university) {
    throw new HttpError(404, "University associated with this program was not found.");
  }

  if (!program.intakes.includes(intake)) {
    throw new HttpError(
      400,
      `The selected program does not offer the ${intake} intake.`
    );
  }
// Prevent the same student from applying to the same program
// for the same intake more than once.
  const existingApplication = await Application.findOne({
    student: req.user._id,
    program: program._id,
    intake,
  });

  if (existingApplication) {
    throw new HttpError(
      409,
      "You have already applied to this program for this intake."
    );
  }

  const application = await Application.create({
    student: req.user._id,
    program: program._id,
    university: university._id,
    destinationCountry: program.country,
    intake,
    status: "submitted",
    timeline: [
      {
        status: "submitted",
        note: "Application submitted.",
      },
    ],
  });

  const populatedApplication = await Application.findById(application._id)
    .populate("student", "fullName email role")
    .populate("program", "title degreeLevel tuitionFeeUsd")
    .populate("university", "name country city")
    .lean();

  res.status(201).json({
    success: true,
    data: populatedApplication,
  });
});

// Update an application's status only when the requested
// transition is explicitly allowed by the application workflow.
const updateApplicationStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body;

  if (!status) {
    throw new HttpError(400, "New application status is required.");
  }

  const application = await Application.findById(req.params.id);

  if (!application) {
    throw new HttpError(404, "Application not found.");
  }

  if (
    application.student.toString() !== req.user._id.toString() &&
    req.user.role !== "counselor"
  ) {
    throw new HttpError(
      403,
      "You are not allowed to update this application."
    );
  }

  // Retrieve the allowed next states for the current status.

  const allowedTransitions =
    validStatusTransitions[application.status] || [];

  if (!allowedTransitions.includes(status)) {
    throw new HttpError(
      400,
      `Invalid status transition from "${application.status}" to "${status}".`
    );
  }

  application.status = status;

  application.timeline.push({
    status,
    note: note || `Application status changed to ${status}.`,
    changedAt: new Date(),
  });

  await application.save();

  const updatedApplication = await Application.findById(application._id)
    .populate("student", "fullName email role")
    .populate("program", "title degreeLevel tuitionFeeUsd")
    .populate("university", "name country city")
    .lean();

  res.json({
    success: true,
    data: updatedApplication,
  });
});

module.exports = {
  createApplication,
  listApplications,
  updateApplicationStatus,
};
