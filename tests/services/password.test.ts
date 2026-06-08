import { describe, expect, it } from "vitest";

import { hashPassword, verifyPassword } from "@/lib/password";

describe("password hashing", () => {
  it("verifies a password against its hash", async () => {
    const passwordHash = await hashPassword("strong-password-123");

    await expect(verifyPassword("strong-password-123", passwordHash)).resolves.toBe(
      true
    );
    await expect(verifyPassword("wrong-password", passwordHash)).resolves.toBe(false);
  });
});
