import { describe, expect, it } from "vitest";

import { canAccessUserResource } from "@/lib/session";

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
