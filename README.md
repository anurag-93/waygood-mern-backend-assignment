# Waygood MERN Stack Backend Developer Intern Assignment

## Overview

This repository contains my implementation of the **MERN Stack Backend Developer Intern Assignment** provided by Waygood.

The work has been completed on top of the provided starter repository and focuses mainly on the backend requirements, including authentication, university and program discovery, recommendation logic, application lifecycle management, MongoDB aggregation, caching, indexing, testing, and API documentation.

The project uses **Express.js, MongoDB, Mongoose, JWT, bcrypt, Jest, and Supertest** for the backend implementation.

---

## Assignment Implementation

The following functionality has been implemented as part of the assignment.

### 1. Authentication and Security

Implemented:

- Student registration
- Student login
- Password hashing using bcrypt
- JWT-based authentication
- Protected APIs using authentication middleware
- Authenticated user profile endpoint
- Input validation for registration and login
- Consistent authentication error responses

### Authentication APIs

```text
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

Example registration request:

```json
{
  "fullName": "Aarav Sharma",
  "email": "aarav@example.com",
  "password": "Candidate123!"
}
```

Login:

```json
{
  "email": "aarav@example.com",
  "password": "Candidate123!"
}
```

The login and registration APIs return a JWT token which is used for protected requests.

For protected requests:

```text
Authorization: Bearer <token>
```

---

## 2. University and Program Discovery

The discovery APIs support filtering, searching, pagination and sorting.

### University Discovery

```text
GET /api/universities
GET /api/universities/popular
```

Supported functionality includes:

- Country filtering
- Partner type filtering
- Scholarship availability filtering
- Search by university name, country, city and tags
- Pagination
- Sorting
- Popular university listing

### Program Discovery

```text
GET /api/programs
```

Supported functionality includes:

- Country filtering
- Degree level filtering
- Intake filtering
- Field filtering
- Maximum tuition fee filtering
- Scholarship availability filtering
- Search
- Pagination
- Sorting by tuition and relevance

Example:

```text
GET /api/programs?country=UK&field=Computer Science&page=1&limit=10
```

The APIs use a consistent response structure containing `success`, `data` and relevant metadata.

---

## 3. Recommendation Engine

The recommendation functionality uses **MongoDB Aggregation** to calculate recommendations based on the student's stored preferences.

The recommendation logic considers factors such as:

- Preferred country
- Interested field
- Maximum budget
- Preferred intake
- IELTS preference

The matching process assigns a score to suitable programs and returns the highest-scoring recommendations.

### Recommendation API

```text
GET /api/recommendations/:studentId
```

The recommendation response also includes the matching reasons so that the result is easier to understand.

The recommendation logic is implemented using MongoDB aggregation rather than loading all programs into Node.js and calculating the complete score in application code.

---

## 4. Application Lifecycle

Students can apply to available programs and track the progress of their applications.

### Application APIs

```text
GET   /api/applications
POST  /api/applications
PATCH /api/applications/:id/status
```

### Application Creation

A student submits:

```json
{
  "programId": "<program-id>",
  "intake": "Fall 2027"
}
```

The backend verifies:

- The program exists
- The associated university exists
- The selected intake is available
- The student has not already applied to the same program for the same intake

### Duplicate Application Prevention

Duplicate applications are prevented at two levels:

1. Application-level validation before creation
2. A MongoDB compound unique index on:

```text
student + program + intake
```

This provides an additional database-level safeguard against duplicate records.

---

## Application Status Workflow

Applications follow a controlled status lifecycle.

```text
draft
  ↓
submitted
  ↓
under-review
  ↓
offer-received
  ↓
visa-processing
  ↓
enrolled
```

An application can also move to:

```text
rejected
```

from the appropriate review stages.

Invalid status transitions are rejected by the backend.

Each status update is stored in the application's timeline with:

- Status
- Note
- Change timestamp

This keeps a history of the application lifecycle instead of only storing the latest status.

---

## 5. Performance and MongoDB Optimisation

The implementation includes several database and API performance improvements.

### MongoDB Indexing

Indexes have been added for frequently queried fields in the main collections.

Examples include:

```text
Program
- university
- country
- field
- degreeLevel
- tuitionFeeUsd

University
- country
- popularScore

Application
- student
- program
- destinationCountry
- intake
- status
```

A compound index is also used for application duplicate prevention:

```text
student + program + intake
```

### Query Optimisation

The discovery APIs use:

- Pagination
- Query limits
- MongoDB filtering
- Sorting
- Parallel item/count queries where appropriate
- Lean queries where suitable

The API also avoids returning unnecessarily large datasets by applying pagination limits.

### Caching

A TTL-based in-memory cache has been implemented for the popular university endpoint.

The cache:

- Stores the generated response
- Uses a configurable TTL
- Returns cached data when available
- Automatically expires stale entries

The cache configuration is controlled through:

```env
CACHE_TTL_SECONDS=300
```

The current cache is process-local and is suitable for the evaluation setup. A shared Redis cache would be more suitable for a multi-instance production deployment.

---

## 6. Error Handling

The backend uses centralised error handling for API errors.

The implementation includes:

- Custom HTTP errors
- Async controller handling
- 404 handling for unknown routes
- Validation errors
- Authentication errors
- Authorisation errors
- Duplicate resource errors
- Invalid application status transitions

Responses follow a consistent structure.

Example:

```json
{
  "success": false,
  "message": "Program not found."
}
```

---

## 7. Project Structure

```text
backend-assignment-template/
│
├── backend/
│   ├── .env.example
│   ├── package.json
│   │
│   └── src/
│       ├── app.js
│       ├── server.js
│       │
│       ├── config/
│       │   ├── constants.js
│       │   ├── database.js
│       │   └── env.js
│       │
│       ├── controllers/
│       │   ├── applicationController.js
│       │   ├── authController.js
│       │   ├── dashboardController.js
│       │   ├── healthController.js
│       │   ├── programController.js
│       │   ├── recommendationController.js
│       │   └── universityController.js
│       │
│       ├── data/
│       │   └── seedData.js
│       │
│       ├── middleware/
│       │   ├── auth.js
│       │   ├── errorHandler.js
│       │   └── notFound.js
│       │
│       ├── models/
│       │   ├── Application.js
│       │   ├── Program.js
│       │   ├── Student.js
│       │   └── University.js
│       │
│       ├── routes/
│       │   ├── applicationRoutes.js
│       │   ├── authRoutes.js
│       │   ├── dashboardRoutes.js
│       │   ├── healthRoutes.js
│       │   ├── programRoutes.js
│       │   ├── recommendationRoutes.js
│       │   └── universityRoutes.js
│       │
│       ├── scripts/
│       │   └── seed.js
│       │
│       ├── services/
│       │   ├── cacheService.js
│       │   └── recommendationService.js
│       │
│       └── utils/
│           ├── asyncHandler.js
│           └── httpError.js
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── App.jsx
│       ├── main.jsx
│       ├── styles.css
│       ├── components/
│       └── data/
│
├── docs/
│
├── .gitignore
└── README.md
```

---

## 8. Environment Configuration

Create a `.env` file inside the `backend` directory.

Example:

```env
PORT=4000

MONGODB_URI=mongodb://127.0.0.1:27017/waygood-evaluation

JWT_SECRET=replace-with-a-long-secret
JWT_EXPIRES_IN=1d

CACHE_TTL_SECONDS=300

REDIS_URL=
OPENAI_API_KEY=
```

For MongoDB Atlas, the `MONGODB_URI` can be replaced with the Atlas connection string.

The actual `.env` file should not be committed to Git.

The repository contains `.env.example` for reference.

---

## 9. Installation

### Backend

Open the backend directory:

```bash
cd backend
```

Install dependencies:

```bash
npm install
```

Create the environment file:

```text
.env
```

Configure the required environment variables.

---

## 10. Database Seeding

The project includes seed data for development and evaluation.

Run:

```bash
npm run seed
```

A successful seed should show:

```text
Connected to MongoDB
Seed completed successfully.
```

The seed data provides sample students, universities and programs for testing the APIs.

---

## 11. Running the Backend

From the `backend` directory:

```bash
npm run dev
```

The backend runs on:

```text
http://localhost:4000
```

Health check:

```text
GET /api/health
```

Example successful response:

```json
{
  "success": true,
  "data": {
    "service": "waygood-evaluation-api",
    "status": "ok"
  }
}
```

---

## 12. Running the Frontend

Open another terminal:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Start the frontend:

```bash
npm run dev
```

The Vite development server will provide the local frontend URL.

---

## 13. Testing

The backend uses **Jest** and **Supertest** for API testing.

Run:

```bash
npm test
```

The current test suite covers the critical flows:

- Health check
- Student registration
- Student login
- Protected profile endpoint
- University discovery
- Program discovery
- Application creation
- Duplicate application prevention
- Application status transitions
- Invalid status transitions

Latest test run:

```text
Test Suites: 4 passed, 4 total
Tests:       13 passed, 13 total
```

Coverage can be generated using:

```bash
npx jest --coverage --runInBand
```

Latest coverage run:

```text
Statements: 78.46%
Branches:   45.69%
Functions:  66.66%
Lines:      79.40%
```

The tests use the configured MongoDB database connection, so MongoDB must be available before running the test suite.

---

## 14. API Response Format

Successful responses generally follow:

```json
{
  "success": true,
  "data": {}
}
```

List APIs may additionally include pagination metadata:

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

Error responses follow:

```json
{
  "success": false,
  "message": "Error message"
}
```

This keeps the API responses predictable for frontend integration and testing.

---

## 15. Assumptions

The following assumptions were made while implementing the assignment:

- A student can apply to the same program more than once only when the intake is different.
- The selected intake must be offered by the program.
- Application status changes must follow the defined transition rules.
- Recommendation matching is based on the student's stored preferences.
- IELTS preference contributes to the recommendation score when applicable.
- The current cache implementation is process-local.
- MongoDB is used as the primary persistent database.
- JWT is used for stateless API authentication.

---

## 16. Key Implementation Decisions

### MongoDB Aggregation for Recommendations

The recommendation requirement is implemented using MongoDB aggregation so that matching and scoring are performed closer to the database layer.

### Database-Level Duplicate Protection

Application duplicates are checked in application code and additionally protected using a MongoDB compound unique index.

### Service Layer

Recommendation and caching logic are separated from controllers where appropriate to keep controllers focused on handling HTTP requests and responses.

### Middleware

Authentication, error handling and route-level concerns are separated into middleware to keep the API structure maintainable.

---

## 17. Submission Notes

This repository represents the implementation work completed against the provided Waygood assignment starter project.

The focus has been on completing the required backend functionality while keeping the existing project structure and extending it where required for the assignment.

The frontend remains part of the provided project structure and is kept available for integration and demonstration purposes.

---

## 18. Technologies Used

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs

### Testing

- Jest
- Supertest

### Frontend

- React
- Vite

### Development

- Git
- GitHub
- Postman
- MongoDB Atlas / MongoDB

---

## 19. Final Implementation Summary

The assignment implementation covers:

- Authentication and JWT security
- Password hashing
- Protected APIs
- University discovery
- Program discovery
- Search, filtering, pagination and sorting
- MongoDB aggregation-based recommendations
- Application creation
- Duplicate application prevention
- Application status workflow
- Application status history
- MongoDB indexes
- Query optimisation
- API caching
- Centralised error handling
- Automated API tests
- Test coverage
- Environment-based configuration
- Seed data for evaluation