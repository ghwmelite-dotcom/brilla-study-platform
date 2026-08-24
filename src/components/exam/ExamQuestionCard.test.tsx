// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('@/stores/themeStore', () => ({
  useThemeStore: () => ({ resolvedTheme: 'light' }),
}));
vi.mock('@/utils', () => ({
  cn: (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(' '),
}));

import { ExamQuestionCard } from './ExamQuestionCard';

const mounted: Array<{ container: HTMLDivElement; root: ReturnType<typeof createRoot> }> = [];

afterEach(async () => {
  for (const entry of mounted.splice(0)) {
    await act(async () => entry.root.unmount());
    entry.container.remove();
  }
});

describe('ExamQuestionCard multiple-choice identifiers', () => {
  it('submits the stable option ID instead of the displayed answer text', async () => {
    const onAnswerSelect = vi.fn();
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    mounted.push({ container, root });

    await act(async () => {
      root.render(
        <ExamQuestionCard
          questionNumber={1}
          questionText="What is 2 + 2?"
          questionType="multiple_choice"
          options={[
            { id: 'A', text: '3' },
            { id: 'B', text: '4' },
          ]}
          onAnswerSelect={onAnswerSelect}
        />,
      );
    });

    const option = Array.from(container.querySelectorAll('button'))
      .find((button) => button.textContent?.includes('4'));
    expect(option).toBeDefined();

    await act(async () => option!.click());
    expect(onAnswerSelect).toHaveBeenCalledWith('B');
    expect(onAnswerSelect).not.toHaveBeenCalledWith('4');
  });
});
