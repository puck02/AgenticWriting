import { beforeEach, describe, expect, it, vi } from "vitest";

import { canAccessUserResource, getOrCreateCurrentUser } from "@/lib/session";

type SessionDb = Parameters<typeof getOrCreateCurrentUser>[0];

const cookieStore = {
  get: vi.fn(),
  set: vi.fn()
};

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => cookieStore)
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

describe("getOrCreateCurrentUser", () => {
  beforeEach(() => {
    cookieStore.get.mockReset();
    cookieStore.set.mockReset();
  });

  it("returns the stable demo user when cookie writes are not allowed", async () => {
    cookieStore.get.mockReturnValue(undefined);
    cookieStore.set.mockImplementation(() => {
      throw new Error("Cookies can only be modified in a Server Action");
    });
    const user = {
      id: "user-demo",
      email: "demo@agentic-writing.local",
      createdAt: new Date()
    };
    const db = {
      user: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue(user)
      }
    } as unknown as SessionDb;

    await expect(getOrCreateCurrentUser(db)).resolves.toEqual(user);
    expect(db.user.create).toHaveBeenCalledWith({
      data: { email: "demo@agentic-writing.local" }
    });
  });

  it("returns the stable demo user when a concurrent request creates it first", async () => {
    cookieStore.get.mockReturnValue(undefined);
    const user = {
      id: "user-demo",
      email: "demo@agentic-writing.local",
      createdAt: new Date()
    };
    const db = {
      user: {
        findUnique: vi.fn().mockResolvedValueOnce(null).mockResolvedValueOnce(user),
        create: vi.fn().mockRejectedValue({ code: "P2002" })
      }
    } as unknown as SessionDb;

    await expect(getOrCreateCurrentUser(db)).resolves.toEqual(user);
  });
});
