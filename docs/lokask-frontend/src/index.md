[⬅ Return to Main Compendium](../../README.md)

# 🎨 Lokask Design System CSS Specification

This document serves as the central design token and structural stylesheet for the Lokask product suite. It defines the color palette, typography, and foundational component styles using Tailwind CSS and CSS custom properties, supporting both light and dark modes.

---

## 🔍 Overview

This file is a comprehensive CSS layer that establishes the visual identity of the application. It uses a system of CSS variables (design tokens) to manage colors, ensuring consistency across different components and themes.

**Key Components:**

1.  **Color Theming:** Defines tokens for primary, secondary, background, and foreground colors for both Light and Dark modes, centered around the 'Terracotta' accent color.
2.  **Utility Classes:** Provides reusable classes for common elements (e.g., `btn-primary`, `card-soft`, `tag-pill`).
3.  **Typography:** Integrates the 'DM Sans' font and sets hierarchical styling for headings.

**Usage:** This stylesheet should be imported globally and forms the basis for all component-level styling.

---

## ⚙️ Detail (Token Breakdown)

### 🌈 Design Tokens (CSS Variables)

The system utilizes HSL values for robust color definition, allowing for easy color shifts and theming.

| Token | Description | Light Mode Value | Dark Mode Value | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `--background` | Default page background. | `30 23% 94%` (Warm off-white) | `0 0% 12%` (Near black) | Global page backgrounds. |
| `--foreground` | Default text color. | `0 0% 18%` (Charcoal) | `30 23% 94%` (Off-white) | Body text and primary text. |
| `--primary` | Accent/Brand Color (Terracotta). | `16 52% 53%` | `16 52% 53%` | Buttons, active states, key highlights. |
| `--terracotta` | Specific brand accent. | `16 52% 53%` | *N/A (Uses primary)* | Specific brand elements (e.g., `.tag-pill`). |
| `--card` | Container background. | `0 0% 100%` | `0 0% 15%` | Cards and information panels. |
| `--secondary` | Secondary action color. | `30 20% 90%` | `0 0% 20%` | Subtle backgrounds, non-primary elements. |
| `--border`/`--input` | Separator lines/Input fields. | `30 15% 85%` | `0 0% 25%` | Form inputs and dividers. |
| `--radius` | Standard border radius. | `0.75rem` | `0.75rem` | Rounded corners for components. |
| `--font-display` | Display font family. | `'DM Sans', sans-serif` | `'DM Sans', sans-serif` | Headings (H1-H6). |

### 🧱 Component Styles

| Class Name | Purpose | Definition/Behavior |
| :--- | :--- | :--- |
| `.btn-primary` | Primary action button. | Uses `bg-primary` with a slight opacity change on hover (`hover:opacity-90`). |
| `.btn-outline-pill` | Secondary button/tag. | Bordered, pill-shaped, non-filled background. |
| `.card-soft` | Elevated container component. | Soft background color (`bg-card`) with a defined shadow (`--shadow-medium`). |
| `.tag-pill` | Informational badge/tag. | Small, rounded badge styled with the `--terracotta` color. |
| `.search-segment` | Search input container. | Flex container for visual grouping of search elements. |
| `.search-label` | Helper text for search input. | Small, uppercase, muted label text. |

### 💡 Theming Flow

The file correctly implements theme switching by defining nested rules under the `:root` (light) and `.dark` (dark) pseudo-classes. Changing the presence of the `.dark` class on the `<body>` automatically swaps all defined CSS tokens.

---

## 📝 Note (Best Practices & Recommendations)

*   **Design Consistency:** The explicit mapping of `--primary` and `--accent` to the same value (`16 52% 53%`) ensures brand color consistency across interactive elements and highlights.
*   **Shadow Management:** Defining distinct shadow tokens (`--shadow-soft`, `--shadow-medium`, `--shadow-strong`) promotes better visual depth control, allowing component developers to choose the appropriate elevation level.
*   **Mobile Responsiveness:** The inclusion of specific media queries for `.chamfer-tr` demonstrates proactive handling of responsive UI shapes (clip-path adjustment).
*   **Linkage:** When developing new components that use these tokens, always reference the token (e.g., `text-foreground` instead of hardcoding `#2E2E2E`) to ensure automatic dark mode adaptation.

---

## ⚠️ Warning / Tech Debt

1.  **Pixel Magic Numbers:** The `calc()` function used in `.chamfer-tr` contains specific pixel calculations (`calc(100% - 80px)`). These numbers should ideally be abstracted into design tokens if they represent structural constraints that might change.
    *   *Recommendation:* Define `--chamfer-size-lg: 80px;` and `--chamfer-size-sm: 40px;` tokens.
2.  **Duplicate Hardcoded Color:** The `.tag-pill` uses a specific HSL calculation: `hsl(var(--terracotta) / 0.12)`. While functional, this explicit opacity division might be fragile if the definition of `--terracotta` changes.
    *   *Recommendation:* Consider creating a new token, e.g., `--terracotta-bg-opacity`, to define the background shade, making the pill more resilient to token updates.
3.  **Structure Refinement:** The definition of tokens and utilities is highly robust, but as the system grows, consider splitting the definition into dedicated files: `tokens.css` (for variables) and `components.css` (for component classes) to improve modularity and build dependency clarity.

---

### Related Files

*   **Theme Definition:** `../../variables.css` (This file acts as the primary variable definition layer).
*   **Typography Usage:** `../components/TextStyles.jsx` (Any React components consuming the font and heading structure should link back here).
*   **Component Library:** `../components/Button.jsx` (The concrete implementation of components like `btn-primary` should reside here).