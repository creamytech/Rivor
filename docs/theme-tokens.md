# River Theme Tokens

The River design system exposes CSS variables for colors, spacing, radius and typography.

## Color Variables
Variables follow the pattern `--color-{palette}-{shade}`.

Example: `--color-navy-900`, `--color-teal-400`.

## Spacing Variables
Spacing tokens use `--space-{step}` based on an 8px grid.

Example: `--space-4` equals `1rem` (16px).

## Radius Variables
Border radii are exposed as `--radius-{size}`.

Example: `--radius-2xl`.

## Typography Variables
Typography variables include font sizes, weights and families.

* `--font-size-base`
* `--font-weight-semibold`
* `--font-family-ui`

Use these variables in Tailwind classes with square bracket notation, e.g. `bg-[var(--color-navy-900)]` or `rounded-[var(--radius-2xl)]`.
