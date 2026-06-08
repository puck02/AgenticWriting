import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  authenticateUser,
  createInvitationCode,
  registerUserWithInvite
} from "@/services/auth/auth-service";

const mocks = vi.hoisted(() => ({
  hashPassword: vi.fn(async (password: string) => `hash:${password}`),
  verifyPassword: vi.fn(async (password: string, hash: string) => hash === `hash:${password}`),
  createOpaqueToken: vi.fn(),
  hashOpaqueToken: vi.fn((token: string) => `token-hash:${token}`)
}));

vi.mock("@/lib/password", () => ({
  hashPassword: mocks.hashPassword,
  verifyPassword: mocks.verifyPassword
}));

vi.mock("@/lib/token", () => ({
  createOpaqueToken: mocks.createOpaqueToken,
  hashOpaqueToken: mocks.hashOpaqueToken
}));

describe("auth-service", () => {
  beforeEach(() => {
    mocks.createOpaqueToken.mockReset();
    mocks.createOpaqueToken.mockReturnValue("session-token");
  });

  it("authenticates a user and creates a login session", async () => {
    const user = {
      id: "user-1",
      email: "writer@example.com",
      passwordHash: "hash:correct-password",
      role: "USER",
      createdAt: new Date()
    };
    const db = {
      user: {
        findUnique: vi.fn().mockResolvedValue(user)
      },
      authSession: {
        create: vi.fn()
      }
    };

    await expect(
      authenticateUser(db, {
        email: " Writer@Example.com ",
        password: "correct-password"
      })
    ).resolves.toMatchObject({
      user,
      sessionToken: "session-token"
    });
    expect(db.user.findUnique).toHaveBeenCalledWith({
      where: { email: "writer@example.com" }
    });
    expect(db.authSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        tokenHash: "token-hash:session-token",
        userId: user.id
      })
    });
  });

  it("registers a user with an unused invitation code", async () => {
    mocks.createOpaqueToken.mockReturnValueOnce("session-token");
    const invite = {
      id: "invite-1",
      codeHash: "token-hash:invite-code",
      codePreview: "code",
      createdByUserId: "admin-1",
      usedByUserId: null,
      usedAt: null,
      expiresAt: null,
      createdAt: new Date()
    };
    const user = {
      id: "user-2",
      email: "new@example.com",
      passwordHash: "hash:new-password",
      role: "USER",
      createdAt: new Date()
    };
    const tx = {
      invitationCode: {
        findUnique: vi.fn().mockResolvedValue(invite),
        updateMany: vi.fn().mockResolvedValue({ count: 1 })
      },
      user: {
        create: vi.fn().mockResolvedValue(user)
      }
    };
    const db = {
      $transaction: vi.fn((callback) => callback(tx)),
      authSession: {
        create: vi.fn()
      }
    };

    await expect(
      registerUserWithInvite(db, {
        email: "new@example.com",
        password: "new-password",
        invitationCode: "invite-code"
      })
    ).resolves.toMatchObject({
      user,
      sessionToken: "session-token"
    });
    expect(tx.user.create).toHaveBeenCalledWith({
      data: {
        email: "new@example.com",
        passwordHash: "hash:new-password",
        role: "USER"
      }
    });
    expect(tx.invitationCode.updateMany).toHaveBeenCalledWith({
      where: { id: invite.id, usedAt: null },
      data: expect.objectContaining({
        usedByUserId: user.id
      })
    });
  });

  it("allows only admins to create invitation codes", async () => {
    const db = {
      invitationCode: {
        create: vi.fn()
      }
    };

    await expect(
      createInvitationCode(db, {
        id: "user-1",
        role: "USER"
      })
    ).rejects.toThrow("Only administrators can create invitation codes");
  });
});
