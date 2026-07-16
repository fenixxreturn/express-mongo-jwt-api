import mongoose from "mongoose";
import { env } from "./config/env";
import { buildApp } from "./app";

async function main() {
  await mongoose.connect(env.mongoUri);
  // eslint-disable-next-line no-console
  console.log("Connected to MongoDB");

  const app = buildApp();
  app.listen(env.port, () => {
    // eslint-disable-next-line no-console
    console.log(`Server listening on port ${env.port}`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Failed to start server", err);
  process.exit(1);
});
