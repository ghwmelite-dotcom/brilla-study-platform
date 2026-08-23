// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ManagedUser } from "@/stores/authStore";

const mocks = vi.hoisted(() => ({
  updateUser: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  getUserExamPreferences: vi.fn(),
  setUserExamPreferences: vi.fn(),
}));

vi.mock("@/stores/authStore", () => ({
  useAuthStore: () => ({
    updateUser: mocks.updateUser,
    sendPasswordResetEmail: mocks.sendPasswordResetEmail,
  }),
}));

vi.mock("@/lib/services", () => ({
  examService: {
    getUserExamPreferences: mocks.getUserExamPreferences,
    setUserExamPreferences: mocks.setUserExamPreferences,
  },
}));

vi.mock("@/components/auth/ExamTypeSelector", () => ({
  ExamTypeSelector: () => <div data-testid="exam-type-selector" />,
}));

vi.mock("@/utils", () => ({
  cn: (...values: Array<string | false | null | undefined>) =>
    values.filter(Boolean).join(" "),
}));

import { EditUserModal } from "../EditUserModal";

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const verifiedUser: ManagedUser = {
  id: "user_1",
  email: "student@test.dev",
  name: "Test Student",
  role: "student",
  status: "approved",
  isActive: true,
  emailVerified: true,
  passwordSet: true,
  xpPoints: 0,
  level: 1,
  streakDays: 0,
  aiGradingCredits: 0,
  createdAt: "2026-08-23T00:00:00.000Z",
  updatedAt: "2026-08-23T00:00:00.000Z",
};

describe("EditUserModal password recovery", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    mocks.updateUser.mockReset().mockResolvedValue(undefined);
    mocks.sendPasswordResetEmail.mockReset().mockResolvedValue(undefined);
    mocks.getUserExamPreferences.mockReset().mockResolvedValue({
      preferences: [],
      primaryExamTypeId: null,
    });
    mocks.setUserExamPreferences.mockReset().mockResolvedValue(undefined);
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.clearAllTimers();
  });

  async function renderUser(user: ManagedUser) {
    await act(async () => {
      root.render(
        <EditUserModal isOpen user={user} onClose={() => undefined} />,
      );
    });
  }

  it("offers a reset link to a verified password user and calls the reset action", async () => {
    await renderUser(verifiedUser);

    const button = Array.from(container.querySelectorAll("button")).find(
      (candidate) => candidate.textContent?.includes("Send reset link"),
    );
    expect(button).toBeDefined();

    await act(async () => {
      button?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(mocks.sendPasswordResetEmail).toHaveBeenCalledWith("user_1");
    expect(container.textContent).toContain(
      "Password reset email sent successfully!",
    );
    expect(container.textContent).not.toContain("User already verified");
  });

  it("uses setup wording for a verified account that has no password yet", async () => {
    await renderUser({ ...verifiedUser, passwordSet: false });

    expect(container.textContent).toContain("Password Not Set");
    expect(container.textContent).toContain("Send setup link");
  });
});
