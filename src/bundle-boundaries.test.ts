import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const sourceRoot = fileURLToPath(new URL('.', import.meta.url));

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(absolutePath);
    return /\.(?:ts|tsx)$/.test(entry.name) ? [absolutePath] : [];
  });
}

function matchingFiles(pattern: RegExp): string[] {
  return sourceFiles(sourceRoot)
    .filter((fileName) => pattern.test(readFileSync(fileName, 'utf8')))
    .map((fileName) => path.relative(sourceRoot, fileName).replaceAll('\\', '/'));
}

describe('frontend bundle boundaries', () => {
  it('imports Zustand stores directly instead of evaluating the store barrel', () => {
    expect(matchingFiles(/from\s+['"]@\/stores['"]/)).toEqual([]);
  });

  it('does not import the complete Lucide namespace', () => {
    expect(
      matchingFiles(/import\s+\*\s+as\s+\w+\s+from\s+['"]lucide-react['"]/),
    ).toEqual([]);
  });

  it('keeps route-heavy landing, home, and dashboard pages lazy', () => {
    const appSource = readFileSync(path.join(sourceRoot, 'App.tsx'), 'utf8');

    expect(appSource).toContain(
      "const LandingPage = lazyWithRetry(() => import('@/pages/Landing')",
    );
    expect(appSource).toContain(
      "const HomePage = lazyWithRetry(() => import('@/pages/Home')",
    );
    expect(appSource).toContain(
      "const DashboardPage = lazyWithRetry(() => import('@/pages/Dashboard')",
    );
  });
});
