import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { RegisterInput, LoginInput } from "../schemas/auth.schema";
import { signAccessToken } from "../utils/jwt";
import { AppError } from "../utils/AppError";

const SALT_ROUNDS = 10;

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as RegisterInput;

    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError(409, "Email already registered");
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await User.create({ email, passwordHash });

    const token = signAccessToken(user._id.toString());
    res.status(201).json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { email, password } = req.body as LoginInput;

    // passwordHash is select:false on the model, so pull it in explicitly for the compare.
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user) {
      throw new AppError(401, "Invalid email or password");
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      throw new AppError(401, "Invalid email or password");
    }

    const token = signAccessToken(user._id.toString());
    res.status(200).json({ token, user: { id: user._id, email: user.email } });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response) {
  const user = req.user!;
  res.status(200).json({ user: { id: user._id, email: user.email } });
}
