import { api } from "./api";

export type UserRole = "patient" | "doctor" | "admin" | "receptionist";

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  assignedDoctorId: string | null;
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

// ─── Admin: user management ───

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  assignedDoctorId: string | null;
};

export function listUsers() {
  return api<{ users: AdminUser[] }>("/auth/users");
}

export function createUser(input: {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: "doctor" | "receptionist" | "admin";
  assignedDoctorId?: string | null;
}) {
  return api<{ user: AdminUser }>("/auth/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function deleteUser(id: string) {
  return api<{ ok: boolean }>(`/auth/users/${id}`, { method: "DELETE" });
}

export function getDoctors() {
  return api<{ doctors: { id: string; name: string }[] }>("/auth/doctors");
}
