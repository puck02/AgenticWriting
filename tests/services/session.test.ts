import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  canAccessUserResource,
  getCurrentUser,
  isAdminUser,
  requireCurrentUser
} from "@/lib/session";

type SessionDb = Parameters<typeof getCurrentUser>[0];

const cookieStore = {
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn()
};

const mocks = vi.hoisted(() => ({
  redirect: vi.fn()
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => cookieStore)
}));

vi.mock("next/navigation", () => ({
  redirect: mocks.redirect
}));

describe("canAccessUserResource", () => {
  it("allows access to the current user's own resource", () => {
    expect(
      canAccessUserResource({
        currentUserId: "user-1",
        resourceUserId: "user-1"
      })
    ).toBe(true);
  });

  it("blocks access to another user's resource", () => {
    expect(
      canAccessUserResource({
        currentUserId: "user-1",
        resourceUserId: "user-2"
      })
    ).toBe(false);
  });
});

describe("getCurrentUser", () => {
  beforeEach(() => {
    cookieStore.get.mockReset();
    cookieStore.delete.mockReset();
    mocks.redirect.mockReset();
  });

  it("returns null when no session cookie exists", async () => {
    cookieStore.get.mockReturnValue(undefined);
    const db = {
      authSession: {
        findUnique: vi.fn()
      }
    } as unknown as SessionDb;

    await expect(getCurrentUser(db)).resolves.toBeNull();
    expect(db.authSession.findUnique).not.toHaveBeenCalled();
  });

  it("returns the session user when the session is valid", async () => {
    cookieStore.get.mockReturnValue({ value: "session-token" });
    const user = {
      id: "user-1",
      email: "writer@example.com",
      passwordHash: "hash",
      role: "USER",
      createdAt: new Date()
    };
    const db = {
      authSession: {
        findUnique: vi.fn().mockResolvedValue({
          id: "session-1",
          tokenHash: "token-hash",
          userId: user.id,
          expiresAt: new Date(Date.now() + 60_000),
          createdAt: new Date(),
          user
        })
      }
    } as unknown as SessionDb;

    await expect(getCurrentUser(db)).resolves.toEqual(user);
  });

  it("clears and ignores an expired session", async () => {
    cookieStore.get.mockReturnValue({ value: "session-token" });
    const db = {
      authSession: {
        findUnique: vi.fn().mockResolvedValue({
          id: "session-1",
          tokenHash: "token-hash",
          userId: "user-1",
          expiresAt: new Date(Date.now() - 60_000),
          createdAt: new Date(),
          user: {
            id: "user-1",
            email: "writer@example.com",
            passwordHash: "hash",
            role: "USER",
            createdAt: new Date()
          }
        })
      }
    } as unknown as SessionDb;

    await expect(getCurrentUser(db)).resolves.toBeNull();
    expect(cookieStore.delete).toHaveBeenCalledWith("agentic_writing_session");
  });
});

describe("requireCurrentUser", () => {
  beforeEach(() => {
    cookieStore.get.mockReset();
    mocks.redirect.mockReset();
  });

  it("redirects anonymous users to login", async () => {
    cookieStore.get.mockReturnValue(undefined);
    const db = {
      authSession: {
        findUnique: vi.fn()
      }
    } as unknown as SessionDb;

    await requireCurrentUser(db);

    expect(mocks.redirect).toHaveBeenCalledWith("/login");
  });
});

describe("isAdminUser", () => {
  it("recognizes admin users", () => {
    expect(isAdminUser({ role: "ADMIN" })).toBe(true);
    expect(isAdminUser({ role: "USER" })).toBe(false);
  });
});
