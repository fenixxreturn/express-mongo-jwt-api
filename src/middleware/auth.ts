import { NextFunction, Request, Response } from "express";
import { User, UserDoc } from "../models/User";
import { verifyAccessToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: UserDoc;
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new AppError(401, "Missing or malformed Authorization header");
    }
    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      throw new AppError(401, "Missing token");
    }

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw new AppError(401, "Invalid or expired token");
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      throw new AppError(401, "User no longer exists");
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
