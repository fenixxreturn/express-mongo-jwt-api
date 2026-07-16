import request from "supertest";
import jwt from "jsonwebtoken";
import { buildApp } from "../src/app";

const app = buildApp();

const credentials = { email: "alice@example.com", password: "hunter22" };

describe("POST /auth/register", () => {
  it("creates a user and returns a token", async () => {
    const res = await request(app).post("/auth/register").send(credentials);
    expect(res.status).toBe(201);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user.email).toBe(credentials.email);
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it("rejects a duplicate email with 409", async () => {
    await request(app).post("/auth/register").send(credentials);
    const res = await request(app).post("/auth/register").send(credentials);
    expect(res.status).toBe(409);
  });

  it("rejects an invalid payload with 400", async () => {
    const res = await request(app).post("/auth/register").send({ email: "not-an-email", password: "123" });
    expect(res.status).toBe(400);
  });
});

describe("POST /auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/auth/register").send(credentials);
  });

  it("returns a token for valid credentials", async () => {
    const res = await request(app).post("/auth/login").send(credentials);
    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
  });

  it("rejects a wrong password with 401", async () => {
    const res = await request(app).post("/auth/login").send({ email: credentials.email, password: "wrong-pass" });
    expect(res.status).toBe(401);
  });

  it("rejects an unknown email with 401", async () => {
    const res = await request(app).post("/auth/login").send({ email: "nobody@example.com", password: "whatever1" });
    expect(res.status).toBe(401);
  });
});

describe("GET /auth/me", () => {
  it("returns the current user for a valid token", async () => {
    await request(app).post("/auth/register").send(credentials);
    const loginRes = await request(app).post("/auth/login").send(credentials);
    const token = loginRes.body.token;

    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(credentials.email);
  });

  it("rejects a request with no token with 401", async () => {
    const res = await request(app).get("/auth/me");
    expect(res.status).toBe(401);
  });

  it("rejects a request with a malformed/bad token with 401", async () => {
    const res = await request(app).get("/auth/me").set("Authorization", "Bearer not-a-real-token");
    expect(res.status).toBe(401);
  });

  it("rejects an expired token with 401", async () => {
    const registerRes = await request(app).post("/auth/register").send(credentials);
    const userId = registerRes.body.user.id;
    const expiredToken = jwt.sign({ sub: userId }, process.env.JWT_SECRET as string, { expiresIn: -10 });

    const res = await request(app).get("/auth/me").set("Authorization", `Bearer ${expiredToken}`);
    expect(res.status).toBe(401);
  });
});
