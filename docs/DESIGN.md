# SENTINEL – Design System

## Typography
- **Font**: *Inter* (Google Fonts). Load via `<link>` in `index.html`.
- **Scale**: 0.875rem – 2rem, using Tailwind `text-sm` … `text-2xl`.

## Color Palette
| Role | Color | Tailwind Token |
|------|-------|----------------|
| Normal | #28a745 | `brand-green` |
| Background Interference | #ffbf00 | `brand-amber` |
| Genuine Leak | #dc3545 | `brand-red` |
| Neutral background | #fafafa – #171717 | `neutral-50` … `neutral-900` |

## Components
- **Status Badge** – large pill, background colour matches classification, transition on change (200 ms ease‑out).
- **Confidence Bar** – horizontal bar filling to `confidence * 100%` with smooth width transition.
- **Severity Chip** – small pill with same colour mapping as badge.
- **Alert Row** – staggered entrance animation, accessible button for acknowledgement.
- **Disclaimer Banner** – fixed bottom, full‑width, high contrast.

## Layout & Density
- Visual density 7 → compact spacing, but enough padding for touch targets.
- Motion intensity 3 → subtle transitions only on state changes (badge colour, row enter, confidence fill).
- Design variance 5 → slight variation in card corners and shadows across components for visual interest.

## Accessibility
- Contrast ratios meet AA (≥4.5:1 for normal text, ≥3:1 for large text).
- All interactive elements have `aria-label`.
- Live region (`aria-live="polite"`) announces classification changes.
- Keyboard navigation fully supported; focus indicator uses `brand‑amber`.
