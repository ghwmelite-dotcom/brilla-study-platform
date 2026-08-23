// @vitest-environment jsdom
import { act, createElement, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/utils', () => ({
  cn: (...values: Array<string | false | null | undefined>) => values.filter(Boolean).join(' '),
}));

import { AdminDropdownMenu } from '../AdminDropdownMenu';
import { AdminInput } from '../AdminInput';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

function MenuHarness() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div data-testid="overflow-container" style={{ overflow: 'auto' }}>
      <button type="button">Previous control</button>
      <AdminDropdownMenu
        isOpen={isOpen}
        onOpenChange={setIsOpen}
        ariaLabel="Actions for John Doe"
        trigger={<span>Open</span>}
      >
        <button type="button" role="menuitem">
          Edit user
        </button>
        <button type="button" role="menuitem" disabled>
          Unavailable action
        </button>
        <button type="button" role="menuitem">
          Delete user
        </button>
      </AdminDropdownMenu>
      <button type="button">Next control</button>
    </div>
  );
}

describe('admin floating controls', () => {
  let container: HTMLDivElement;
  let root: Root;
  let triggerRect: DOMRect;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    Object.defineProperty(window, 'innerWidth', {
      configurable: true,
      value: 1024,
    });
    Object.defineProperty(window, 'innerHeight', {
      configurable: true,
      value: 768,
    });
    triggerRect = {
      bottom: 700,
      height: 40,
      left: 940,
      right: 980,
      top: 660,
      width: 40,
      x: 940,
      y: 660,
      toJSON: () => ({}),
    } as DOMRect;

    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function getBoundingClientRect() {
      if (this.getAttribute('role') === 'menu') {
        return {
          bottom: 0,
          height: 200,
          left: 0,
          right: 208,
          top: 0,
          width: 208,
          x: 0,
          y: 0,
          toJSON: () => ({}),
        } as DOMRect;
      }

      return triggerRect;
    });
  });

  afterEach(async () => {
    await act(async () => root.unmount());
    container.remove();
    vi.restoreAllMocks();
  });

  it('portals the menu outside an overflow container and keeps it in view', async () => {
    await act(async () => {
      root.render(createElement(MenuHarness));
    });

    const trigger = container.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]');
    expect(trigger).toBeTruthy();

    await act(async () => trigger?.click());

    const menu = document.body.querySelector<HTMLElement>('[role="menu"][aria-label="Actions for John Doe"]');
    expect(menu).toBeTruthy();
    expect(container.contains(menu)).toBe(false);
    expect(menu?.className).toContain('fixed');
    expect(menu?.className).toContain('max-h-[calc(100vh-1.5rem)]');
    expect(menu?.style.visibility).toBe('visible');
    expect(menu?.style.left).toBe('772px');
    expect(menu?.style.top).toBe('452px');
    expect(document.activeElement?.textContent).toBe('Edit user');

    await act(async () => {
      document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'ArrowDown' }));
    });
    expect(document.activeElement?.textContent).toBe('Delete user');

    await act(async () => {
      document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Home' }));
    });
    expect(document.activeElement?.textContent).toBe('Edit user');

    const rectCallsBeforeResize = vi.mocked(HTMLElement.prototype.getBoundingClientRect).mock.calls.length;
    await act(async () => window.dispatchEvent(new Event('resize')));
    expect(vi.mocked(HTMLElement.prototype.getBoundingClientRect).mock.calls.length).toBeGreaterThan(
      rectCallsBeforeResize,
    );

    await act(async () => {
      document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Tab' }));
    });
    expect(document.body.querySelector('[role="menu"]')).toBeNull();
    expect(document.activeElement?.textContent).toBe('Next control');

    await act(async () => trigger?.click());
    expect(document.activeElement?.textContent).toBe('Edit user');

    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    });

    expect(document.body.querySelector('[role="menu"]')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes from the backdrop and when the trigger scrolls off-screen', async () => {
    await act(async () => {
      root.render(createElement(MenuHarness));
    });

    const trigger = container.querySelector<HTMLButtonElement>('button[aria-haspopup="menu"]');
    await act(async () => trigger?.click());

    const backdrop = document.body.querySelector<HTMLElement>('[aria-hidden="true"]');
    await act(async () => backdrop?.click());
    expect(document.body.querySelector('[role="menu"]')).toBeNull();

    await act(async () => trigger?.click());
    expect(document.body.querySelector('[role="menu"]')).toBeTruthy();

    triggerRect = {
      ...triggerRect,
      bottom: -10,
      top: -50,
      y: -50,
    } as DOMRect;
    await act(async () => window.dispatchEvent(new Event('scroll')));
    expect(document.body.querySelector('[role="menu"]')).toBeNull();
  });

  it('keeps shared input text clear of left and right icons', async () => {
    await act(async () => {
      root.render(
        createElement(AdminInput, {
          leftIcon: createElement('span', null, 'L'),
          rightIcon: createElement('span', null, 'R'),
        }),
      );
    });

    const input = container.querySelector('input');
    expect(input?.className).toContain('!pl-10');
    expect(input?.className).toContain('!pr-10');
  });
});
