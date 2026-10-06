const request = require("supertest");

const app = require("../src/app");

describe("Health API", () => {
  test("GET /api/health should return a healthy response", async () => {
    const response = await request(app).get("/api/health");

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
  });
});