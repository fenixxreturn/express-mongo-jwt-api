// Runs before the test framework and any test file is loaded, so app modules
// that read process.env at import time (config/env.ts) see these values.
process.env.JWT_SECRET = "test-secret-do-not-use-in-prod";
process.env.JWT_EXPIRES_IN = "1h";
process.env.CORS_ORIGINS = "http://localhost:3000";
