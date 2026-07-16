import rateLimit from "express-rate-limit";

// ponytail: fixed window is enough for a login/register brute-force guard;
// swap for a distributed limiter (redis store) only if this runs multi-instance.
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many attempts, please try again later" },
});
