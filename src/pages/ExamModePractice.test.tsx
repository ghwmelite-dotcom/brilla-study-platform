// @vitest-environment jsdom
import { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Question } from "@/types";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const questions: Question[] = [
  {
    id: "agric-1",
    topicId: "soil-science",
    subjectId: "wassce-agricultural-science",
    questionText: "Which soil layer contains the most humus?",
    questionType: "multiple_choice",
    roundType: "standard",
    options: [
      { id: "A", text: "Topsoil" },
      { id: "B", text: "Bedrock" },
    ],
    correctAnswer: "",
    difficulty: "easy",
    points: 1,
    marks: 1,
    timeLimit: 0,
    createdAt: "2026-08-25T00:00:00.000Z",
  },
  {
    id: "agric-2",
    topicId: "crop-production",
    subjectId: "wassce-agricultural-science",
    questionText: "Which practice reduces soil erosion?",
    questionType: "multiple_choice",
    roundType: "standard",
    options: [
      { id: "A", text: "Contour ploughing" },
      { id: "B", text: "Bush burning" },
    ],
    correctAnswer: "",
    difficulty: "easy",
    points: 1,
    marks: 1,
    timeLimit: 0,
    createdAt: "2026-08-25T00:00:00.000Z",
  },
];

const mocks = vi.hoisted(() => ({
  apiPost: vi.fn(),
  navigate: vi.fn(),
  fetchDailyUsage: vi.fn(),
  setUsageFromResponse: vi.fn(),
  checkLimitReached: vi.fn(() => false),
  searchParams:
    "mode=drill&subject=wassce-agricultural-science&topic=soil-science&count=2",
}));

vi.mock("react-router-dom", () => ({
  useNavigate: () => mocks.navigate,
  useSearchParams: () => [new URLSearchParams(mocks.searchParams)],
  useLocation: () => ({ state: { questions } }),
}));
vi.mock("@/lib/api", () => ({ api: { post: mocks.apiPost, get: vi.fn() } }));
vi.mock("@/utils", () => ({
  cn: (...classes: Array<string | false | null | undefined>) =>
    classes.filter(Boolean).join(" "),
}));
vi.mock("@/components/exam", async () => ({
  ExamLayout: (await import("@/components/exam/ExamLayout")).ExamLayout,
  ExamQuestionCard: (await import("@/components/exam/ExamQuestionCard"))
    .ExamQuestionCard,
}));
vi.mock("@/stores/examStore", () => ({
  useExamStore: () => ({ currentExamType: "wassce" }),
}));
vi.mock("@/stores/themeStore", () => ({
  useThemeStore: () => ({ resolvedTheme: "light", setTheme: vi.fn() }),
}));
vi.mock("@/stores/uiStore", () => ({
  useUIStore: () => ({ setDistractionFreeMode: vi.fn() }),
}));
vi.mock("@/stores/usageStore", () => ({
  useUsageStore: () => ({
    dailyUsage: {
      used: 0,
      limit: -1,
      remaining: -1,
      isPremium: true,
      isUnlimited: true,
    },
    fetchDailyUsage: mocks.fetchDailyUsage,
    setUsageFromResponse: mocks.setUsageFromResponse,
    checkLimitReached: mocks.checkLimitReached,
  }),
}));
vi.mock("@/components/subscription", () => ({
  DailyUsageIndicator: () => null,
  LimitReachedModal: () => null,
}));

import ExamModePractice from "./ExamModePractice";

const mounted: Array<{
  container: HTMLDivElement;
  root: ReturnType<typeof createRoot>;
}> = [];

async function renderPage() {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root = createRoot(container);
  mounted.push({ container, root });
  await act(async () => {
    root.render(<ExamModePractice />);
    await Promise.resolve();
  });
  return container;
}

function findButton(container: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll("button")).find(
    (candidate) => candidate.textContent?.trim().includes(text),
  );
  if (!button) throw new Error(`Button not found: ${text}`);
  return button;
}

function findLastExactButton(
  container: HTMLElement,
  text: string,
): HTMLButtonElement {
  const buttons = Array.from(container.querySelectorAll("button")).filter(
    (candidate) => candidate.textContent?.trim() === text,
  );
  const button = buttons.at(-1);
  if (!button) throw new Error(`Button not found: ${text}`);
  return button;
}

function successfulAttempt(explanation: string, attemptId = "attempt_1") {
  return {
    success: true,
    data: {
      attemptId,
      isCorrect: true,
      correctAnswer: "A",
      explanation,
      pointsEarned: 1,
      usage: {
        used: 0,
        limit: -1,
        remaining: -1,
        isUnlimited: true,
        showUpgradePrompt: false,
      },
    },
  };
}

beforeEach(() => {
  mocks.apiPost.mockReset();
  mocks.navigate.mockReset();
  mocks.fetchDailyUsage.mockReset();
  mocks.setUsageFromResponse.mockReset();
  mocks.checkLimitReached.mockReset().mockReturnValue(false);
  mocks.searchParams =
    "mode=drill&subject=wassce-agricultural-science&topic=soil-science&count=2";
});

afterEach(async () => {
  for (const entry of mounted.splice(0)) {
    await act(async () => entry.root.unmount());
    entry.container.remove();
  }
});

describe("ExamModePractice question transition", () => {
  it("submits an answer even when a stale client usage snapshot says the limit is reached", async () => {
    mocks.checkLimitReached.mockReturnValue(true);
    mocks.apiPost.mockResolvedValueOnce({
      success: true,
      data: {
        attemptId: "attempt_1",
        isCorrect: true,
        correctAnswer: "A",
        explanation: "Topsoil contains the greatest concentration of humus.",
        pointsEarned: 1,
        usage: {
          used: 0,
          limit: -1,
          remaining: -1,
          isUnlimited: true,
          showUpgradePrompt: false,
        },
      },
    });

    const container = await renderPage();

    await act(async () => {
      findButton(container, "Topsoil").click();
      await Promise.resolve();
    });

    await vi.waitFor(() => expect(mocks.apiPost).toHaveBeenCalledOnce());
    expect(mocks.apiPost).toHaveBeenCalledWith("/questions/agric-1/attempt", {
      answer: "A",
      timeTaken: expect.any(Number),
      clientRequestId: expect.any(String),
    });
  });

  it("surfaces a failed attempt, allows retry, and advances after the retry succeeds", async () => {
    mocks.apiPost
      .mockResolvedValueOnce({
        success: false,
        error: "Failed to submit answer",
      })
      .mockResolvedValueOnce({
        success: true,
        data: {
          attemptId: "attempt_1",
          isCorrect: true,
          correctAnswer: "A",
          explanation: "Topsoil contains the greatest concentration of humus.",
          pointsEarned: 1,
          usage: {
            used: 0,
            limit: -1,
            remaining: -1,
            isUnlimited: true,
            showUpgradePrompt: false,
          },
        },
      });

    const container = await renderPage();
    const firstAnswer = findButton(container, "Topsoil");

    await act(async () => {
      firstAnswer.click();
      await Promise.resolve();
    });

    await vi.waitFor(() =>
      expect(container.textContent).toContain("Failed to submit answer"),
    );
    expect(findButton(container, "Topsoil").getAttribute("aria-pressed")).toBe(
      "true",
    );
    expect(findButton(container, "Next").disabled).toBe(true);

    await act(async () => {
      findButton(container, "Retry submission").click();
      await Promise.resolve();
    });

    await vi.waitFor(() =>
      expect(findButton(container, "Next").disabled).toBe(false),
    );
    const firstPayload = mocks.apiPost.mock.calls[0][1];
    const retryPayload = mocks.apiPost.mock.calls[1][1];
    expect(retryPayload).toEqual(firstPayload);
    expect(retryPayload.clientRequestId).toEqual(expect.any(String));
    await act(async () => findButton(container, "Next").click());
    expect(container.textContent).toContain("Question 2");
    expect(container.textContent).toContain(
      "Which practice reduces soil erosion?",
    );
  });

  it("creates a new request ID only after a completed answer is revisited", async () => {
    mocks.apiPost
      .mockResolvedValueOnce(
        successfulAttempt(
          "Topsoil contains the greatest concentration of humus.",
          "attempt_1",
        ),
      )
      .mockResolvedValueOnce(
        successfulAttempt(
          "Topsoil contains the greatest concentration of humus.",
          "attempt_2",
        ),
      );

    const container = await renderPage();
    await act(async () => {
      findButton(container, "Topsoil").click();
      await Promise.resolve();
    });
    await vi.waitFor(() =>
      expect(findButton(container, "Next").disabled).toBe(false),
    );
    const firstRequestId = mocks.apiPost.mock.calls[0][1].clientRequestId;

    await act(async () => findButton(container, "Next").click());
    await act(async () => findButton(container, "Previous").click());
    await act(async () => {
      findButton(container, "Topsoil").click();
      await Promise.resolve();
    });

    await vi.waitFor(() => expect(mocks.apiPost).toHaveBeenCalledTimes(2));
    expect(mocks.apiPost.mock.calls[1][1].clientRequestId).not.toBe(
      firstRequestId,
    );
  });
  it("saves the completed drill before results navigation and retries without losing answers", async () => {
    mocks.apiPost
      .mockResolvedValueOnce(
        successfulAttempt(
          "Topsoil contains the greatest concentration of humus.",
          "attempt_1",
        ),
      )
      .mockResolvedValueOnce(
        successfulAttempt(
          "Contour ploughing slows surface runoff.",
          "attempt_2",
        ),
      )
      .mockResolvedValueOnce({
        success: false,
        error: "Session storage unavailable",
      })
      .mockResolvedValueOnce({ success: true, data: { id: "session-1" } });

    const container = await renderPage();

    await act(async () => {
      findButton(container, "Topsoil").click();
      await Promise.resolve();
    });
    await vi.waitFor(() =>
      expect(findButton(container, "Next").disabled).toBe(false),
    );
    await act(async () => findButton(container, "Next").click());

    await act(async () => {
      findButton(container, "Contour ploughing").click();
      await Promise.resolve();
    });
    await vi.waitFor(() =>
      expect(findButton(container, "Finish").disabled).toBe(false),
    );
    await act(async () => findButton(container, "Finish").click());

    expect(container.textContent).toContain("Submit Exam?");
    expect(container.textContent).toContain("You have answered all questions.");

    await act(async () => {
      findLastExactButton(container, "Submit").click();
      await Promise.resolve();
    });

    await vi.waitFor(() =>
      expect(container.textContent).toContain("Session storage unavailable"),
    );
    expect(
      mocks.navigate.mock.calls.some(([path]) => path === "/practice/results"),
    ).toBe(false);
    expect(container.textContent).toContain(
      "Your completed answers are still here.",
    );
    expect(container.textContent).toContain("Question 2");
    expect(
      findButton(container, "Contour ploughing").getAttribute("aria-pressed"),
    ).toBe("true");

    const firstSave = mocks.apiPost.mock.calls[2];
    expect(firstSave[0]).toBe("/practice/sessions");
    expect(firstSave[1]).toMatchObject({
      mode: "topic_drill",
      subjectId: "wassce-agricultural-science",
      topicId: "soil-science",
      clientRequestId: expect.any(String),
      attemptIds: ["attempt_1", "attempt_2"],
    });
    expect(firstSave[1]).not.toHaveProperty("subject_id");
    expect(firstSave[1]).not.toHaveProperty("questions_count");
    expect(firstSave[1]).not.toHaveProperty("correct_count");
    expect(firstSave[1]).not.toHaveProperty("total_time");
    expect(firstSave[1]).not.toHaveProperty("questionsCount");
    expect(firstSave[1]).not.toHaveProperty("correctCount");
    expect(firstSave[1]).not.toHaveProperty("totalTime");
    expect(firstSave[1]).not.toHaveProperty("score");

    await act(async () => {
      findButton(container, "Retry session save").click();
      await Promise.resolve();
    });

    await vi.waitFor(() =>
      expect(mocks.navigate).toHaveBeenCalledWith(
        "/practice/results",
        expect.objectContaining({
          state: expect.objectContaining({
            totalQuestions: 2,
            correctCount: 2,
            score: 2,
          }),
        }),
      ),
    );
    expect(
      mocks.apiPost.mock.calls.filter(
        ([path]) => path === "/practice/sessions",
      ),
    ).toHaveLength(2);
  });

  it("does not attribute a subject-wide mixed-topic drill to the first question topic", async () => {
    mocks.searchParams =
      "mode=drill&subject=wassce-agricultural-science&count=2";
    mocks.apiPost.mockResolvedValueOnce({
      success: true,
      data: { id: "session-subject-wide" },
    });

    const container = await renderPage();
    await act(async () => findButton(container, "Submit").click());
    expect(container.textContent).toContain("Submit Exam?");

    await act(async () => {
      findLastExactButton(container, "Submit").click();
      await Promise.resolve();
    });

    await vi.waitFor(() =>
      expect(mocks.apiPost).toHaveBeenCalledWith(
        "/practice/sessions",
        expect.objectContaining({
          subjectId: "wassce-agricultural-science",
          topicId: null,
        }),
      ),
    );
  });
});
