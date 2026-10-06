const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../src/app");
const connectDatabase = require("../src/config/database");

describe("Authentication API", () => {
    beforeAll(async () => {
  await connectDatabase();
});

afterAll(async () => {
  await mongoose.disconnect();
});

  const testUser = {
    fullName: "Test Student",
    email: `test-${Date.now()}@example.com`,
    password: "TestPassword123",
  };

  let token;

  test("POST /api/auth/register should create a student", async () => {
    const response = await request(app)
      .post("/api/auth/register")
      .send(testUser);

    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.user.email).toBe(testUser.email);
  });

  test("POST /api/auth/login should return a JWT", async () => {
    const response = await request(app)
      .post("/api/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();

    token = response.body.data.token;
  });

  test("GET /api/auth/me should reject requests without a token", async () => {
    const response = await request(app).get("/api/auth/me");

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("GET /api/auth/me should return the authenticated student", async () => {
    const response = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.email).toBe(testUser.email);
  });
});