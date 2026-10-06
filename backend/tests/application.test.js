const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../src/app");
const connectDatabase = require("../src/config/database");
const Program = require("../src/models/Program");
const Application = require("../src/models/Application");

describe("Application Workflow API", () => {
  let token;
  let program;
  let applicationId;

  const testUser = {
    fullName: "Application Test Student",
    email: `application-test-${Date.now()}@example.com`,
    password: "TestPassword123",
  };

  beforeAll(async () => {
    await connectDatabase();

    const registerResponse = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    token = registerResponse.body.data.token;

    program = await Program.findOne();

    if (!program) {
      throw new Error("No seeded program found for application tests.");
    }
  });

  afterAll(async () => {
    if (applicationId) {
      await Application.findByIdAndDelete(applicationId);
    }

    await mongoose.disconnect();
  });

  test("POST /api/applications should create an application", async () => {
    const intake = program.intakes[0];

    const response = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${token}`)
      .send({
        programId: program._id.toString(),
        intake,
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("submitted");
    expect(response.body.data.program._id).toBe(program._id.toString());

    applicationId = response.body.data._id;
  });

  test("POST /api/applications should prevent duplicate applications", async () => {
    const response = await request(app)
      .post("/api/applications")
      .set("Authorization", `Bearer ${token}`)
      .send({
        programId: program._id.toString(),
        intake: program.intakes[0],
      });

    expect(response.statusCode).toBe(409);
    expect(response.body.success).toBe(false);
  });

  test("PATCH /api/applications/:id/status should allow a valid transition", async () => {
    const response = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        status: "under-review",
        note: "Application is now under review.",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("under-review");

    expect(response.body.data.timeline).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          status: "submitted",
        }),
        expect.objectContaining({
          status: "under-review",
        }),
      ])
    );
  });

  test("PATCH /api/applications/:id/status should reject an invalid transition", async () => {
    const response = await request(app)
      .patch(`/api/applications/${applicationId}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({
        status: "enrolled",
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });
});