import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppNav } from "@/components/AppNav";

const pathnameMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn()
  })
}));

describe("AppNav", () => {
  it("marks the profile navigation item as current on profile pages", () => {
    pathnameMock.mockReturnValue("/profile");

    render(<AppNav user={{ email: "writer@example.com", role: "USER" }} />);

    expect(
      screen.getByRole("link", { name: "我的写作画像" }).getAttribute("aria-current")
    ).toBe("page");
    expect(
      screen.getByRole("link", { name: "新建批改" }).getAttribute("aria-current")
    ).toBeNull();
  });

  it("keeps the review workflow under the new review navigation item", () => {
    pathnameMock.mockReturnValue("/essays/essay-1");

    render(<AppNav user={{ email: "writer@example.com", role: "USER" }} />);

    expect(
      screen.getByRole("link", { name: "新建批改" }).getAttribute("aria-current")
    ).toBe("page");
  });

  it("shows the invitation link only for admins", () => {
    pathnameMock.mockReturnValue("/admin/invites");

    render(<AppNav user={{ email: "admin@example.com", role: "ADMIN" }} />);

    expect(
      screen.getByRole("link", { name: "邀请码" }).getAttribute("aria-current")
    ).toBe("page");
  });
});
