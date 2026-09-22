import { createRequire } from "node:module";
import { env } from "./env.js";

const jwt = createRequire(import.meta.url)("jsonwebtoken") as typeof import("jsonwebtoken");

export type UserRole = "patient" | "doctor" | "admin" | "receptionist" | "cashier";

export type TokenPayload = {
  sub: string;
  role: UserRole;
};

export function signToken(payload: TokenPayload) {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
}
