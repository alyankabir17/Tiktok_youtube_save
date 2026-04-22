import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { LoginBody, RegisterBody } from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";

const router: IRouter = Router();

function toUserDto(u: { id: string; email: string; username: string | null; avatarUrl: string | null; createdAt: Date }) {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    avatarUrl: u.avatarUrl,
    createdAt: u.createdAt.toISOString(),
  };
}

router.post("/auth/register", async (req, res) => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "BAD_REQUEST", message: "Email and password (min 6 chars) are required." });
  }
  const { email, password, username } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();
  const existing = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);
  if (existing.length > 0) {
    return res.status(409).json({ error: "EMAIL_EXISTS", message: "An account with that email already exists." });
  }
  const passwordHash = await bcrypt.hash(password, 10);
  const inserted = await db
    .insert(usersTable)
    .values({ email: normalizedEmail, passwordHash, username: username ?? null })
    .returning();
  const user = inserted[0]!;
  req.session.userId = user.id;
  return res.json({ user: toUserDto(user) });
});

router.post("/auth/login", async (req, res) => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "BAD_REQUEST", message: "Email and password are required." });
  }
  const { email, password } = parsed.data;
  const normalizedEmail = email.trim().toLowerCase();
  const found = await db.select().from(usersTable).where(eq(usersTable.email, normalizedEmail)).limit(1);
  const user = found[0];
  if (!user) {
    return res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Invalid email or password." });
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "INVALID_CREDENTIALS", message: "Invalid email or password." });
  }
  req.session.userId = user.id;
  return res.json({ user: toUserDto(user) });
});

router.post("/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("connect.sid");
    res.json({ success: true });
  });
});

router.get("/auth/me", async (req, res) => {
  if (!req.session.userId) return res.json({ user: null });
  const found = await db.select().from(usersTable).where(eq(usersTable.id, req.session.userId)).limit(1);
  const user = found[0];
  if (!user) return res.json({ user: null });
  return res.json({ user: toUserDto(user) });
});

export default router;
