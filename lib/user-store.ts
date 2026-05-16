import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import { unstable_noStore as noStore } from "next/cache";

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  provider: "google" | "email";
  companyName: string;
  passwordHash?: string;
  createdAt: string;
};

const dataDirectory = path.join(process.cwd(), "data");
const usersFile = path.join(dataDirectory, "users.json");

const demoGoogleUser: UserProfile = {
  id: "user_demo_google",
  name: "PulseTap Demo User",
  email: "demo@pulsetap.co.uk",
  provider: "google",
  companyName: "Pixel Solutions Ltd",
  createdAt: "2026-05-16"
};

async function ensureUsersFile() {
  await mkdir(dataDirectory, { recursive: true });

  try {
    await readFile(usersFile, "utf8");
  } catch {
    await writeUsers([]);
  }
}

export async function readUsers() {
  noStore();
  await ensureUsersFile();
  const raw = await readFile(usersFile, "utf8");
  return JSON.parse(raw) as UserProfile[];
}

export async function writeUsers(users: UserProfile[]) {
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(usersFile, `${JSON.stringify(users, null, 2)}\n`, "utf8");
}

export async function registerDemoGoogleUser() {
  const users = await readUsers();
  const existingUser = users.find((user) => user.id === demoGoogleUser.id);

  if (existingUser) {
    return existingUser;
  }

  const user = {
    ...demoGoogleUser,
    createdAt: new Date().toISOString().slice(0, 10)
  };

  await writeUsers([...users, user]);
  return user;
}

export async function registerEmailUser({
  name,
  email,
  password,
  companyName
}: {
  name: string;
  email: string;
  password: string;
  companyName: string;
}) {
  const users = await readUsers();
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = users.find((user) => user.email.toLowerCase() === normalizedEmail);

  if (existingUser) {
    return {
      ok: false as const,
      message: "An account with this email already exists."
    };
  }

  const user: UserProfile = {
    id: randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    provider: "email",
    companyName: companyName.trim() || name.trim(),
    passwordHash: createHash("sha256").update(password).digest("hex"),
    createdAt: new Date().toISOString().slice(0, 10)
  };

  await writeUsers([...users, user]);

  return {
    ok: true as const,
    user
  };
}

export async function getUserById(userId: string) {
  const users = await readUsers();
  return users.find((user) => user.id === userId) ?? null;
}
