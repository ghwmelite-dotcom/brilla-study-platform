# Design Skill for Brilla Study Platform

---
name: design
description: Use this skill when making UI changes to ensure consistency with the Brilla Study Platform design system
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
---

## Overview

Brilla Study Platform is a Ghanaian educational platform built with React, TypeScript, and Tailwind CSS. The design system reflects Ghana's national colors and emphasizes clarity, accessibility, and engagement for students.

## Color System

### Brand Colors (Ghana-themed)

```
Primary (Green):
  DEFAULT: #006B3F
  light: #00A86B
  dark: #004D2C
  50-900 scale available (primary-50 to primary-900)

Secondary (Gold/Yellow):
  DEFAULT: #FCD116
  light: #FFE066
  dark: #D4A800
  50-900 scale available

Accent (Red):
  DEFAULT: #CE1126
  light: #FF4D5E
  dark: #A00D1E
  50-900 scale available

Neutral (Grays):
  50: #F9FAFB (backgrounds)
  100-400: light grays
  500: #6B7280 (muted text)
  600-700: dark grays
  800-900: near black (headings)
```

### Admin Dark Theme

For admin pages, use the `admin-*` color utilities:
- `bg-admin-bg` (dark navy #0f172a)
- `bg-admin-bg-secondary` (#1e293b)
- `text-admin-text` (light #f1f5f9)
- `text-admin-text-secondary` (#94a3b8)
- Accent colors: `admin-accent-cyan`, `admin-accent-blue`, `admin-accent-purple`, `admin-accent-emerald`, `admin-accent-amber`, `admin-accent-rose`

## Typography

```
Font Families:
  - Body: font-sans (Inter)
  - Headings: font-display (Poppins)

Use Cases:
  - Page titles: text-2xl or text-3xl font-display font-bold
  - Section headers: text-lg or text-xl font-semibold
  - Body text: text-base text-neutral-900
  - Muted/secondary text: text-sm text-neutral-500
  - Labels: text-sm font-medium text-neutral-700
```

## Component Patterns

### Button Component

Import from `@/components/common/Button`:

```tsx
import { Button } from '@/components/common/Button';

<Button variant="primary" size="md">Click Me</Button>
<Button variant="secondary" size="lg" fullWidth>Full Width</Button>
<Button variant="outline" isLoading>Loading...</Button>
<Button variant="ghost" leftIcon={<Icon />}>With Icon</Button>
```

Variants: `primary` | `secondary` | `accent` | `outline` | `ghost` | `danger`
Sizes: `sm` | `md` | `lg`

### Card Component

Import from `@/components/common/Card`:

```tsx
import { Card, CardHeader, CardContent, CardFooter } from '@/components/common/Card';

<Card variant="default" padding="md" hoverable>
  <CardHeader title="Title" subtitle="Subtitle" action={<Button />} />
  <CardContent>Content here</CardContent>
  <CardFooter>Footer actions</CardFooter>
</Card>
```

Variants: `default` | `bordered` | `elevated`
Padding: `none` | `sm` | `md` | `lg`

### Other Common Components

- `Modal` - for dialogs and overlays
- `Input` - form inputs with validation states
- `Badge` - status indicators and tags
- `Progress` - progress bars
- `Timer` - countdown/timer display

## CSS Utility Classes

### Pre-defined Component Classes (from index.css)

```css
/* Buttons */
.btn, .btn-primary, .btn-secondary, .btn-accent, .btn-outline, .btn-ghost

/* Cards */
.card

/* Forms */
.input, .label

/* Badges */
.badge, .badge-primary, .badge-secondary, .badge-accent
.badge-success, .badge-warning, .badge-error

/* Admin Theme */
.admin-card, .admin-input, .admin-btn, .admin-btn-primary
.admin-badge-cyan, .admin-badge-emerald, .admin-badge-amber
```

### Custom Utility Classes

```css
/* Gradients */
.text-gradient          /* Ghana flag gradient text */
.bg-gradient-ghana      /* Ghana flag gradient background */

/* Safe Areas (mobile) */
.safe-area-bottom
.safe-area-top
.safe-area-inset

/* Touch */
.touch-manipulation
```

## Animations

Available animation classes:

```css
.animate-fade-in       /* Fade in 0.3s */
.animate-slide-up      /* Slide up with fade 0.3s */
.animate-scale-in      /* Scale in 0.2s */
.animate-slide-in      /* Slide in from right 0.3s */
.animate-bounce-in     /* Bounce in effect 0.5s */
.animate-pulse-glow    /* Golden glow pulse (infinite) */
.animate-spin-slow     /* Slow spin 3s */
```

Tailwind built-in animations also available:
- `animate-pulse`, `animate-bounce`, `animate-spin`
- Custom: `animate-pulse-slow`, `animate-bounce-slow`, `animate-shimmer`

## Shadows

```css
/* Light theme */
shadow-card           /* Subtle card shadow */
shadow-card-hover     /* Elevated hover state */

/* Admin dark theme */
shadow-admin-card
shadow-admin-card-hover
shadow-glow-cyan, shadow-glow-blue, shadow-glow-purple
shadow-glow-emerald, shadow-glow-amber, shadow-glow-rose
```

## Spacing & Layout

- Use Tailwind's spacing scale: `p-4`, `m-2`, `gap-3`, etc.
- Common patterns:
  - Page container: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
  - Card padding: `p-4` or `p-6`
  - Stack spacing: `space-y-4` or `gap-4`
  - Grid layouts: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`

## Responsive Design

Mobile-first approach with breakpoints:
- `sm:` (640px) - Small tablets
- `md:` (768px) - Tablets
- `lg:` (1024px) - Desktops
- `xl:` (1280px) - Large desktops
- `2xl:` (1536px) - Extra large screens

Example:
```tsx
<div className="text-sm md:text-base lg:text-lg">
  Responsive text
</div>
```

## Accessibility Requirements

1. **Color Contrast**: Maintain WCAG 2.1 AA contrast ratios (4.5:1 for text)
2. **Focus States**: All interactive elements must have visible focus indicators (use `focus:ring-2 focus:ring-offset-2`)
3. **Semantic HTML**: Use proper heading hierarchy (h1 > h2 > h3)
4. **ARIA Labels**: Add labels to icon-only buttons
5. **Keyboard Navigation**: Ensure all interactions work with keyboard

## Icon Guidelines

Use Lucide React icons:
```tsx
import { BookOpen, Trophy, Users } from 'lucide-react';

<BookOpen className="w-5 h-5 text-primary" />
```

Standard sizes: `w-4 h-4` (small), `w-5 h-5` (default), `w-6 h-6` (large)

## Form Patterns

```tsx
<div className="space-y-4">
  <div>
    <label className="label">Email</label>
    <input className="input" type="email" placeholder="Enter email" />
  </div>
  <div>
    <label className="label">Password</label>
    <input className="input" type="password" />
    <p className="text-xs text-red-500 mt-1">Error message here</p>
  </div>
</div>
```

## Loading States

1. **Button loading**: Use `isLoading` prop on Button component
2. **Skeleton loading**: Use `<Skeleton />` component from `@/components/ui/Skeleton`
3. **Spinner**: Use `animate-spin` on a circular SVG or icon

## State Indicators

```tsx
// Success
<div className="text-green-600 bg-green-50 p-3 rounded-lg">Success message</div>

// Warning
<div className="text-yellow-700 bg-yellow-50 p-3 rounded-lg">Warning message</div>

// Error
<div className="text-red-600 bg-red-50 p-3 rounded-lg">Error message</div>

// Info
<div className="text-blue-600 bg-blue-50 p-3 rounded-lg">Info message</div>
```

## Best Practices

1. **Use existing components** - Check `src/components/common/` before creating new ones
2. **Use the cn() utility** - For conditional class merging: `cn('base-class', condition && 'conditional-class')`
3. **Avoid inline styles** - Use Tailwind utilities or CSS classes
4. **Keep components pure** - Separate logic from presentation
5. **Use TypeScript interfaces** - Define props with proper types
6. **Follow the file structure** - Components go in appropriate subdirectories under `src/components/`

## File Structure

```
src/components/
  common/          # Reusable UI primitives (Button, Card, Input, Modal)
  analytics/       # Charts and statistics
  admin/           # Admin-specific components
  chat/            # Chat/messaging components
  layout/          # Layout components (Layout, MobileBottomNav)
  ui/              # Low-level UI components (Skeleton)
```
