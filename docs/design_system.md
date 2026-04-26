# Design System: Dost AI (Luminal Precision)

## Creative Vision

The Dost AI design system is inspired by the intersection of **High-Speed Intelligence** and **Digital Clarity**. The aesthetic centers on a vibrant, electric palette set against a deep midnight background.

The goal is to create an interface that feels **Instant, Intelligent, and Frictionless**—where the AI's power is felt through smooth transitions and high-contrast precision.

## Core Principles

1. **Flat Intelligence**: We avoid complex gradients to maintain a clean, technical look. Color is used as a functional tool for hierarchy and state, not just decoration.
2. **Neon Precision**: The Electric Cyan and Neon Lime are our primary instruments. They represent active intelligence and successful task completion.
3. **Deep Focus**: A strict dark-mode-first approach ensures that user content and AI insights are the brightest elements on the screen, reducing cognitive load.

## Typography

We use **Poppins** across the entire platform.

- **Headlines**: Semi-Bold weight with tight tracking (-0.02em) for a modern, tech-forward feel.
- **Body**: Regular weight with generous line height (1.6) for maximum readability during long interaction sessions.
- **Data/Labels**: Medium weight, sometimes all-caps for technical metadata.

## Color Strategy (No Gradients)

### Core Colors (Consistent across modes)
- **Primary (Electric Cyan - #00D2FF)**: Used for primary actions, focus states, and the core identity.
- **Secondary (Neon Lime - #9DFF00)**: Used for success states and highlighting AI-driven features.
- **Tertiary (Vivid Pink - #EA4C89)**: Used for secondary highlights and multi-chromatic depth.

### Adaptive Neutrals

#### Dark Mode (Default)
- **Background**: `#0D0C22` (Midnight Navy)
- **Main Text**: `#E3DFFE` (Luminous Off-white)
- **Muted Text**: `#BBC9CF` (Bluish Grey)

#### Light Mode
- **Background**: `#FCF8FF` (Pristine Light Lavender)
- **Main Text**: `#1A1930` (Deep Midnight Navy)
- **Muted Text**: `#3C494E` (Muted Slate Grey)

## Shapes & Radius

- **Small (sm)**: `0.25rem` (4px) — Used for small interactive elements.
- **Default (Base)**: `0.5rem` (8px) — Used for standard buttons and inputs.
- **Medium (md)**: `0.75rem` (12px) — Used for most UI cards and containers.
- **Large (lg)**: `1rem` (16px) — Used for main layout sections.
- **Extra Large (xl)**: `1.5rem` (24px) — Used for prominent feature cards.
- **Full**: `9999px` — Used for pill-shaped badges and status icons.

## Interaction & Feel

- **Motion & Animation**: We use **Framer Motion** for all UI transitions. Animations should be snappy but organic (using spring physics).
- **Floating Components**: Key modules (like the AI assistant bubble or context cards) should appear to "float" above the base layer, utilizing `backdrop-blur` and subtle Z-axis movement.
- **Scrollytelling**: As the user scrolls, elements should reveal themselves with subtle entrance animations (fade-in + slide-up) to create a narrative flow.
- **State Changes**: Buttons and interactive areas should snap between colors instantly (100ms) to mimic AI speed, with a slight scale-up (1.02) on hover.
- **Elevation**: Depth is achieved through tonal shifts (e.g., `#1A1A24` for elevated surfaces) and backdrop blurs rather than heavy shadows.
- **Borders**: Subtle 1px solid borders using the Primary or Secondary colors at 15% opacity to define containers.
