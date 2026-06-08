import type { AuthSession, InvitationCode, User } from "@prisma/client";

import { hashPassword, verifyPassword } from "@/lib/password";
import { createSessionExpiresAt, isAdminUser } from "@/lib/session";
import { createOpaqueToken, hashOpaqueToken } from "@/lib/token";

type AuthUser = User;
type AuthSessionStore = {
  authSession: {
    create(args: { data: Pick<AuthSession, "tokenHash" | "userId" | "expiresAt"> }):
      | Promise<AuthSession>
      | Promise<unknown>;
    deleteMany?(args: { where: { tokenHash: string } }): Promise<unknown>;
  };
};
type UserStore = {
  user: {
    findUnique(args: { where: { email: string } }): Promise<AuthUser | null>;
  };
};
type InvitationStore = {
  invitationCode: {
    create(args: {
      data: {
        codeHash: string;
        codePreview: string;
        createdByUserId: string;
        expiresAt: Date | null;
      };
    }): Promise<InvitationCode>;
    findMany?(args: unknown): Promise<InvitationCode[]>;
  };
};
type RegistrationTransaction = {
  invitationCode: {
    findUnique(args: { where: { codeHash: string } }): Promise<InvitationCode | null>;
    updateMany(args: {
      where: { id: string; usedAt: null };
      data: { usedAt: Date; usedByUserId: string };
    }): Promise<{ count: number }>;
  };
  user: {
    create(args: {
      data: {
        email: string;
        passwordHash: string;
        role: "USER";
      };
    }): Promise<AuthUser>;
  };
};
type RegistrationDb = AuthSessionStore & {
  $transaction<T>(callback: (tx: RegistrationTransaction) => Promise<T>): Promise<T>;
};

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status = 400
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export async function authenticateUser(
  db: UserStore & AuthSessionStore,
  input: { email: string; password: string }
) {
  const email = normalizeEmail(input.email);
  const user = await db.user.findUnique({ where: { email } });

  if (!user?.passwordHash) {
    throw new AuthError("邮箱或密码不正确。", 401);
  }

  const isValidPassword = await verifyPassword(input.password, user.passwordHash);

  if (!isValidPassword) {
    throw new AuthError("邮箱或密码不正确。", 401);
  }

  return createLoginSession(db, user);
}

export async function registerUserWithInvite(
  db: RegistrationDb,
  input: { email: string; password: string; invitationCode: string }
) {
  const email = normalizeEmail(input.email);
  const invitationCode = normalizeInvitationCode(input.invitationCode);

  assertValidPassword(input.password);

  const passwordHash = await hashPassword(input.password);

  try {
    const user = await db.$transaction(async (tx) => {
      const invitation = await tx.invitationCode.findUnique({
        where: { codeHash: hashOpaqueToken(invitationCode) }
      });

      if (!isInvitationUsable(invitation)) {
        throw new AuthError("邀请码无效或已被使用。", 400);
      }

      const createdUser = await tx.user.create({
        data: {
          email,
          passwordHash,
          role: "USER"
        }
      });
      const updatedInvite = await tx.invitationCode.updateMany({
        where: { id: invitation.id, usedAt: null },
        data: {
          usedAt: new Date(),
          usedByUserId: createdUser.id
        }
      });

      if (updatedInvite.count === 0) {
        throw new AuthError("邀请码已被使用。", 400);
      }

      return createdUser;
    });

    return createLoginSession(db, user);
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new AuthError("这个邮箱已经注册。", 409);
    }

    throw error;
  }
}

export async function createInvitationCode(
  db: InvitationStore,
  adminUser: Pick<User, "id" | "role">,
  options: { expiresAt?: Date | null } = {}
) {
  if (!isAdminUser(adminUser)) {
    throw new AuthError("Only administrators can create invitation codes", 403);
  }

  const code = createOpaqueToken(18);
  const invitation = await db.invitationCode.create({
    data: {
      codeHash: hashOpaqueToken(code),
      codePreview: formatCodePreview(code),
      createdByUserId: adminUser.id,
      expiresAt: options.expiresAt ?? null
    }
  });

  return { code, invitation };
}

export async function createLoginSession(
  db: AuthSessionStore,
  user: AuthUser
) {
  const sessionToken = createOpaqueToken();
  const expiresAt = createSessionExpiresAt();

  await db.authSession.create({
    data: {
      tokenHash: hashOpaqueToken(sessionToken),
      userId: user.id,
      expiresAt
    }
  });

  return { user, sessionToken, expiresAt };
}

export async function deleteLoginSession(db: AuthSessionStore, sessionToken: string) {
  await db.authSession.deleteMany?.({
    where: {
      tokenHash: hashOpaqueToken(sessionToken)
    }
  });
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizeInvitationCode(code: string): string {
  return code.trim();
}

function assertValidPassword(password: string) {
  if (password.length < 8) {
    throw new AuthError("密码至少需要 8 个字符。", 400);
  }
}

function isInvitationUsable(invitation: InvitationCode | null): invitation is InvitationCode {
  if (!invitation || invitation.usedAt) {
    return false;
  }

  return !invitation.expiresAt || invitation.expiresAt > new Date();
}

function formatCodePreview(code: string): string {
  return `${code.slice(0, 6)}...${code.slice(-4)}`;
}

function isUniqueConstraintError(error: unknown): boolean {
  return (error as { code?: unknown }).code === "P2002";
}
