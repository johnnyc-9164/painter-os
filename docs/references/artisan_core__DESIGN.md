---
name: Artisan Core
colors:
  surface: '#f7f9fb'
  surface-dim: '#d8dadc'
  surface-bright: '#f7f9fb'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f6'
  surface-container: '#eceef0'
  surface-container-high: '#e6e8ea'
  surface-container-highest: '#e0e3e5'
  on-surface: '#191c1e'
  on-surface-variant: '#434656'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f3'
  outline: '#737688'
  outline-variant: '#c3c5d9'
  surface-tint: '#004ced'
  primary: '#003ec7'
  on-primary: '#ffffff'
  primary-container: '#0052ff'
  on-primary-container: '#dfe3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#414f64'
  on-tertiary: '#ffffff'
  tertiary-container: '#59677d'
  on-tertiary-container: '#d7e6ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001452'
  on-primary-fixed-variant: '#0038b6'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#d5e3fd'
  tertiary-fixed-dim: '#b9c7e0'
  on-tertiary-fixed: '#0d1c2f'
  on-tertiary-fixed-variant: '#3a485c'
  background: '#f7f9fb'
  on-background: '#191c1e'
  surface-variant: '#e0e3e5'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  container-max: 1440px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
  stack-sm: 8px
  stack-md: 16px
  stack-lg: 32px
---

## Brand & Style

The design system is engineered for a high-end service platform that bridges the gap between craftsmanship and modern technology. The brand personality is **authoritative, precise, and sophisticated**, evoking the reliability of a premium contractor with the efficiency of a Silicon Valley startup.

The design style leverages **Modern Minimalism** with a focus on high-density information management. It utilizes generous whitespace to reduce cognitive load in complex administrative tasks, while employing subtle depth through soft shadows and layered surfaces to create a clear visual hierarchy. The emotional response should be one of "effortless control"—transforming the messy reality of painting services into a clean, digital operation.

## Colors

The palette is anchored in trust and clarity. 
- **Deep Navy & Charcoal (#0F172A, #334155):** These serve as the foundation for typography, sidebars, and structural elements, establishing a professional and grounded tone.
- **Painter’s Blue (#0052FF):** A vibrant, high-energy blue used exclusively for primary actions, progress indicators, and key focus states. It represents the "active" work being done.
- **Clean Teal (#0D9488):** Used as a secondary action color for "Success" states, financial indicators, and completed service milestones.
- **Neutrals:** A range of cool grays from `#F8FAFC` to `#94A3B8` provides the canvas for the UI, ensuring the interface feels airy and organized.

## Typography

The design system uses **Inter** exclusively to maintain a systematic, tech-forward aesthetic. The type scale is optimized for legibility in data-heavy environments.
- **Headlines:** Use Semi-Bold (600) or Bold (700) weights with slight negative letter-spacing to give a compact, modern feel.
- **Body Text:** Standardized at 16px for optimal readability in administrative panels.
- **Labels:** Used for status badges and small captions, often utilizing Medium (500) weight to distinguish them from standard body text.

## Layout & Spacing

The layout follows a **12-column fluid grid** for desktop, transitioning to a 4-column grid for mobile. 
- **The Sidebar:** A fixed 280px navigation rail is used for the admin dashboard to ensure constant access to top-level tools.
- **Spacing Rhythm:** Based on a 4px baseline grid. Most components should use `16px` (stack-md) or `24px` for internal padding to maintain a spacious, premium feel.
- **Safe Margins:** Content should never bleed into the edges; a minimum 32px margin is maintained on desktop to reinforce the minimalist "whitespace-first" philosophy.

## Elevation & Depth

This design system avoids heavy shadows in favor of **Ambient Elevation**. 
- **Level 0 (Base):** Backgrounds use the neutral `#F8FAFC` to create a soft canvas.
- **Level 1 (Cards/Inputs):** Pure white `#FFFFFF` surfaces with a very soft, diffused shadow (`0px 4px 20px rgba(15, 23, 42, 0.05)`).
- **Level 2 (Dropdowns/Modals):** Increased shadow depth to indicate interaction priority (`0px 10px 30px rgba(15, 23, 42, 0.1)`).
- **Interactive States:** Hover states on cards should subtly lift (increased shadow) or change border-color to the Primary Blue, rather than changing the background color.

## Shapes

The shape language is consistently **Rounded**, using an 8px base radius.
- **Standard (8px):** Applied to buttons, input fields, and small cards.
- **Large (16px):** Applied to main dashboard containers and modal windows.
- **Full (Pill):** Used exclusively for Status Indicators (Chips) and the Chatbot input field to make them feel more approachable and distinct from functional buttons.

## Components

### Buttons & Inputs
Buttons feature high-contrast fills for primary actions and subtle outlines for secondary ones. Input fields use a 1px border (`#E2E8F0`) that transitions to `Primary Blue` on focus, accompanied by a soft blue outer glow.

### Elegant Cards
Cards are the primary organizational unit. They feature white backgrounds, 16px corner radii, and ample internal padding (24px). Headers within cards should use `label-sm` for categorization.

### Status Indicators
Status badges use a "soft-pill" style: a light tinted background with a high-contrast text color (e.g., "In Progress" uses a light blue background with dark blue text).

### Conversational UI (Chatbot)
The chatbot interface is differentiated by a slightly more "organic" feel. Message bubbles use a 12px radius, but the corner pointing toward the speaker is sharpened to 4px. The chat input is a large, pill-shaped field to encourage a friendly, low-pressure interaction.

### Admin Panel Elements
Tables should use horizontal dividers only—no vertical borders—to keep the interface clean. Rows should have a subtle hover effect (`#F1F5F9`) to aid in data tracking.