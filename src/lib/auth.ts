import { api } from "./api";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: "patient" | "doctor";
};

type AuthResponse = { token: string; user: User };

export function signup(input: { name: string; email: string; phone: string; password: string }) {
  return api<AuthResponse>("/auth/signup", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: { email: string; password: string }) {
  return api<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout() {
  return api<{ ok: boolean }>("/auth/logout", { method: "POST" });
}

export function me() {
  return api<{ user: User }>("/auth/me");
}
