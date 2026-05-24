---
name: Zenith Kanji
colors:
  surface: '#fff8f7'
  surface-dim: '#f1d3d2'
  surface-bright: '#fff8f7'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff0ef'
  surface-container: '#ffe9e8'
  surface-container-high: '#ffe1e0'
  surface-container-highest: '#f9dcda'
  on-surface: '#271717'
  on-surface-variant: '#5b403f'
  inverse-surface: '#3e2c2b'
  inverse-on-surface: '#ffedeb'
  outline: '#8f6f6e'
  outline-variant: '#e4bebc'
  surface-tint: '#bb152c'
  primary: '#b7102a'
  on-primary: '#ffffff'
  primary-container: '#db313f'
  on-primary-container: '#fffbff'
  inverse-primary: '#ffb3b1'
  secondary: '#5e5f56'
  on-secondary: '#ffffff'
  secondary-container: '#e4e3d7'
  on-secondary-container: '#64655c'
  tertiary: '#595a71'
  on-tertiary: '#ffffff'
  tertiary-container: '#71738b'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad8'
  primary-fixed-dim: '#ffb3b1'
  on-primary-fixed: '#410007'
  on-primary-fixed-variant: '#92001c'
  secondary-fixed: '#e4e3d7'
  secondary-fixed-dim: '#c7c7bc'
  on-secondary-fixed: '#1b1c15'
  on-secondary-fixed-variant: '#46473f'
  tertiary-fixed: '#e0e0fc'
  tertiary-fixed-dim: '#c4c4df'
  on-tertiary-fixed: '#181a2e'
  on-tertiary-fixed-variant: '#43455b'
  background: '#fff8f7'
  on-background: '#271717'
  surface-variant: '#f9dcda'
typography:
  display-kanji:
    fontFamily: notoSerif
    fontSize: 80px
    fontWeight: '400'
    lineHeight: 96px
    letterSpacing: 0.05em
  headline-lg:
    fontFamily: beVietnamPro
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: beVietnamPro
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-md:
    fontFamily: beVietnamPro
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  unit: 4px
  container-padding: 24px
  stack-gap-sm: 12px
  stack-gap-md: 24px
  stack-gap-lg: 40px
  touch-target-min: 48px
---

## Brand & Style
The design system is built on the principle of *Ma* (negative space), creating a digital environment that mirrors the calm focus of a traditional calligraphy studio. It targets language learners who value aesthetic clarity and structured progress. 

The visual style is **Soft Minimalism**—a blend of contemporary Japanese editorial design and functional SaaS clarity. It avoids the clutter of traditional educational tools, instead using generous whitespace, subtle tactile cues, and a refined "paper-like" texture to reduce cognitive load. The UI should evoke an emotional response of "calm productivity," making the daunting task of learning Kanji feel approachable and iterative.

## Colors
The palette is rooted in a "Modern Washi" aesthetic. The primary Soft Red is reserved for "Aha!" moments—primary actions, leveling up, and key highlights—mimicking the *Hanko* (seal) on a finished work. 

The background uses an off-white tint to reduce eye strain during long study sessions. In dark mode, the interface shifts to a deep, ink-like charcoal, maintaining high contrast with primary colors to ensure the Kanji strokes remain sharp and legible. Success and information states use desaturated pastels to provide feedback without breaking the user's focus.

## Typography
This design system employs a dual-typeface strategy. **Inter** provides the functional backbone for UI elements, ensuring maximum readability at small sizes and high technical reliability. **Be Vietnam Pro** is used for headlines to inject a contemporary, friendly character.

For the Kanji themselves, **Noto Serif** is utilized to honor the calligraphic heritage of the characters, emphasizing stroke weight variation and terminal flourishes. All Kanji display elements should have increased letter-spacing to allow the character's form to "breathe."

## Layout & Spacing
The layout follows a **fluid-to-fixed** model optimized for mobile-first interaction. A 4-column grid is used for mobile, expanding to 8 columns for tablets. 

A "Safe-Air" margin of 24px is maintained around the screen edges to prevent the UI from feeling cramped. Vertical rhythm is established using 12px, 24px, and 40px increments. Card layouts must never exceed 90% of the screen width to maintain the "floating" paper aesthetic.

## Elevation & Depth
Depth is created through **Tonal Layering** and **Soft Ambient Shadows**. Instead of harsh black shadows, we use low-opacity tints of the tertiary color (#2B2D42) with a high blur radius (e.g., 20px blur, 4px Y-offset at 8% opacity).

Elevated elements like cards and primary buttons should feel like they are gently resting on a surface. Success/Error states are indicated by tonal shifts in the background of the element rather than just shadow changes, maintaining a flat, modern profile.

## Shapes
The shape language is defined by extreme **Pill-shaped** and oversized rounded corners. Large containers use a 24px-32px radius to evoke a friendly, non-intimidating atmosphere. Small components like tags and chips use a full-radius pill shape. This softness balances the "sharpness" of the Kanji characters themselves.

## Components
- **Primary Buttons:** High-saturation #E63946 background with white text. Height is fixed at 56px for easy thumb access. Use a subtle bottom-heavy shadow to give it a "pressable" tactile feel.
- **Kanji Flashcards:** White background with a 32px corner radius. The Kanji character is centered using the `display-kanji` style. Subtle 1px borders in a muted neutral are used instead of heavy shadows.
- **Progress Rings:** Use a 6px stroke width with rounded caps. The unfilled portion should be a very light version of the background tint (#F0EFE0) to remain unobtrusive.
- **Input Fields:** Soft-filled (background-tinted) fields with no borders, using a 16px radius. On focus, they transition to a thin 2px primary-colored border.
- **Lists:** Items are separated by whitespace rather than dividers. Each list item is its own rounded container or a "floating" row with generous 16px vertical padding.
- **Study Mode Toggle:** A pill-shaped segmented control with a sliding high-contrast background to indicate the active state.