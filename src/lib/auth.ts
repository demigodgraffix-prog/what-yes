import { prisma } from "./prisma";

// Simplified role type
export type UserRole = "ADMIN" | "SELLER" | "BUYER";

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  avatar?: string | null;
  role?: UserRole;
}

// User type from database
export type DbUser = {
  id: string;
  email: string;
  username: string;
  avatar: string | null;
  stripeAccountId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Server-side function to get current user from session
// Note: This function should only be called from Server Components or API routes
export async function getCurrentUser(userId?: string): Promise<DbUser | null> {
  if (!userId) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    return user;
  } catch {
    return null;
  }
}

export interface AuthResponse {
  user: AuthUser | null;
  error?: string;
}

export async function register(username: string, email: string, _password: string): Promise<AuthResponse> {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "register", username, email }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { user: null, error: data.error || "Registration failed" };
  }

  return { user: data.user };
}

export async function login(email: string, _password: string): Promise<AuthResponse> {
  const res = await fetch("/api/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", email }),
  });

  const data = await res.json();

  if (!res.ok) {
    return { user: null, error: data.error || "Login failed" };
  }

  return { user: data.user };
}

export async function getSession(): Promise<AuthResponse> {
  const res = await fetch("/api/auth", {
    method: "GET",
    credentials: "include",
  });

  const data = await res.json();
  return { user: data.user };
}

export async function logout(): Promise<void> {
  await fetch("/api/auth", {
    method: "DELETE",
    credentials: "include",
  });
}

export function isAdmin(user: AuthUser | null): boolean {
  return user?.role === "ADMIN";
}

export function isSeller(user: AuthUser | null): boolean {
  return user?.role === "SELLER" || user?.role === "ADMIN";
}

export function isBuyer(user: AuthUser | null): boolean {
  return user?.role === "BUYER";
}
