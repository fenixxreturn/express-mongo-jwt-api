import request from "supertest";
import { buildApp } from "../src/app";

const app = buildApp();

async function registerAndLogin(email: string) {
  const credentials = { email, password: "hunter22" };
  await request(app).post("/auth/register").send(credentials);
  const res = await request(app).post("/auth/login").send(credentials);
  return res.body.token as string;
}

describe("/items", () => {
  it("rejects unauthenticated requests with 401", async () => {
    const res = await request(app).post("/items").send({ title: "no auth" });
    expect(res.status).toBe(401);
  });

  it("lets an owner create and then list their own item", async () => {
    const token = await registerAndLogin("owner@example.com");

    const createRes = await request(app)
      .post("/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Buy milk", description: "2%" });
    expect(createRes.status).toBe(201);
    expect(createRes.body.item.title).toBe("Buy milk");

    const listRes = await request(app).get("/items").set("Authorization", `Bearer ${token}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.items).toHaveLength(1);
  });

  it("lets an owner read, update and delete their own item", async () => {
    const token = await registerAndLogin("owner2@example.com");

    const createRes = await request(app)
      .post("/items")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Original" });
    const id = createRes.body.item._id;

    const getRes = await request(app).get(`/items/${id}`).set("Authorization", `Bearer ${token}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.item.title).toBe("Original");

    const patchRes = await request(app)
      .patch(`/items/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated" });
    expect(patchRes.status).toBe(200);
    expect(patchRes.body.item.title).toBe("Updated");

    const deleteRes = await request(app).delete(`/items/${id}`).set("Authorization", `Bearer ${token}`);
    expect(deleteRes.status).toBe(204);

    const getAfterDelete = await request(app).get(`/items/${id}`).set("Authorization", `Bearer ${token}`);
    expect(getAfterDelete.status).toBe(404);
  });

  it("blocks a different user from reading someone else's item", async () => {
    const ownerToken = await registerAndLogin("owner3@example.com");
    const strangerToken = await registerAndLogin("stranger@example.com");

    const createRes = await request(app)
      .post("/items")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ title: "Private item" });
    const id = createRes.body.item._id;

    const res = await request(app).get(`/items/${id}`).set("Authorization", `Bearer ${strangerToken}`);
    expect(res.status).toBe(404);
  });

  it("blocks a different user from updating or deleting someone else's item", async () => {
    const ownerToken = await registerAndLogin("owner4@example.com");
    const strangerToken = await registerAndLogin("stranger2@example.com");

    const createRes = await request(app)
      .post("/items")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ title: "Also private" });
    const id = createRes.body.item._id;

    const patchRes = await request(app)
      .patch(`/items/${id}`)
      .set("Authorization", `Bearer ${strangerToken}`)
      .send({ title: "Hijacked" });
    expect(patchRes.status).toBe(404);

    const deleteRes = await request(app).delete(`/items/${id}`).set("Authorization", `Bearer ${strangerToken}`);
    expect(deleteRes.status).toBe(404);

    // owner's item is untouched
    const getRes = await request(app).get(`/items/${id}`).set("Authorization", `Bearer ${ownerToken}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.item.title).toBe("Also private");
  });

  it("rejects an invalid create payload with 400", async () => {
    const token = await registerAndLogin("validator@example.com");
    const res = await request(app).post("/items").set("Authorization", `Bearer ${token}`).send({ title: "" });
    expect(res.status).toBe(400);
  });

  it("returns 404 for a nonexistent item id", async () => {
    const token = await registerAndLogin("owner5@example.com");
    const res = await request(app)
      .get("/items/64b7f9f1f1f1f1f1f1f1f1f1")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
