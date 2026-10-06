const jwt = require("jsonwebtoken");
const Student = require("../models/Student");
const env = require("../config/env");

const asyncHandler = require("../utils/asyncHandler");
const HttpError = require("../utils/httpError");

// Generate a JWT containing the student's ID and role.
// The token is used by the authentication middleware to identify
// the authenticated user on protected API requests.

function generateToken(student) {
  return jwt.sign(
    {
      sub: student._id.toString(),
      role: student.role,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
    }
  );
}

function starterMessage(capability) {
  return `${capability} is intentionally left incomplete for the candidate assignment.`;
}



const register = asyncHandler(async (req, res) => {
  const {
  fullName,
  email,
  password,
  targetCountries,
  interestedFields,
  preferredIntake,
  maxBudgetUsd,
  englishTest,
} = req.body;

if (!fullName || !email || !password) {
  throw new HttpError(400, "Full name, email and password are required.");
}

if (password.length < 8) {
  throw new HttpError(400, "Password must be at least 8 characters.");
}
// Normalize the email before checking for an existing account.
// This prevents duplicate accounts caused by different email casing.

const normalizedEmail = email.toLowerCase().trim();

const existingStudent = await Student.findOne({
  email: normalizedEmail,
});

if (existingStudent) {
  throw new HttpError(409, "Account with this email already exists.");
}

// Student model hashes the password automatically through
// its Mongoose pre-save hook.
const student = await Student.create({
  fullName: fullName.trim(),
  email: normalizedEmail,
  password,
  targetCountries,
  interestedFields,
  preferredIntake,
  maxBudgetUsd,
  englishTest,
});

// Generate a JWT immediately after successful registration
// so the newly registered user can access protected APIs.

const token = generateToken(student);

res.status(201).json({
  success: true,
  data: {
    token,
    user: {
      id: student._id,
      fullName: student.fullName,
      email: student.email,
      role: student.role,
    },
  },
});
});

// Retrieve the account using the normalized email and verify
// the supplied password using the model's comparePassword method.

const login = asyncHandler(async (req, res) => {
 const { email, password } = req.body;

if (!email || !password) {
  throw new HttpError(400, "Email and password are required.");
}

const normalizedEmail = email.toLowerCase().trim();

const student = await Student.findOne({
  email: normalizedEmail,
});

if (!student) {
  throw new HttpError(401, "Invalid email or password.");
}

const passwordMatches = await student.comparePassword(password);

if (!passwordMatches) {
  throw new HttpError(401, "Invalid email or password.");
}

const token = generateToken(student);

// Return only safe profile fields.
// The password hash is never exposed through the API response.

res.status(200).json({
  success: true,
  data: {
    token,
    user: {
      id: student._id,
      fullName: student.fullName,
      email: student.email,
      role: student.role,
    },
  },
});
});

const me = asyncHandler(async (req, res) => {
  res.status(200).json({
  success: true,
  data: {
    user: req.user,
  },
});
});

module.exports = {
  register,
  login,
  me,
};
