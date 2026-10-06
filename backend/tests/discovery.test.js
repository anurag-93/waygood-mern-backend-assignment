const request = require("supertest");
const mongoose = require("mongoose");

const app = require("../src/app");
const connectDatabase = require("../src/config/database");

describe("Discovery APIs", () => {
  beforeAll(async () => {
    await connectDatabase();
  });

  afterAll(async () => {
    await mongoose.disconnect();
  });

  test("GET /api/universities should return universities", async () => {
    const response = await request(app).get("/api/universities");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.meta).toBeDefined();
  });

  test("GET /api/programs should return programs", async () => {
    const response = await request(app).get("/api/programs");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body.meta).toBeDefined();
  });

  test("GET /api/programs should support pagination", async () => {
    const response = await request(app)
      .get("/api/programs")
      .query({
        page: 1,
        limit: 5,
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.meta.page).toBe(1);
    expect(response.body.meta.limit).toBe(5);
  });

  test("GET /api/programs should support country filtering", async () => {
    const response = await request(app)
      .get("/api/programs")
      .query({
        country: "Canada",
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);

    response.body.data.forEach((program) => {
      expect(program.country).toBe("Canada");
    });
  });
});