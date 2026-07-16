import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AccessTokenPayload {
  sub: string;
}

export function signAccessToken(userId: string): string {
  return jwt.sign({ sub: userId } as AccessTokenPayload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
    algorithm: "HS256",
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  // Pin the algorithm so a forged token cannot downgrade to "none" or another alg.
  return jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] }) as AccessTokenPayload;
}
