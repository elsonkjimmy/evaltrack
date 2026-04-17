# Design System Specification: Academic Excellence Redefined

## 1. Overview & Creative North Star
### The Creative North Star: "The Intellectual Sanctuary"
This design system moves beyond the cold, utilitarian nature of standard academic software. It is a digital sanctuary for high-level evaluation and tracking. We achieve this through **Atmospheric Depth**—combining the clarity of solid data environments with the ethereal quality of glassmorphism. 

To break the "template" look, we utilize **Intentional Asymmetry**. Sidebars and topbars do not "dock" to the edges of the screen; they float as distinct architectural layers. By overlapping glass surfaces over a rich, tonal gradient, we create a sense of focused calm, where data is not just "displayed" but "curated."

---

## 2. Colors & Surface Logic
The palette is rooted in a sophisticated transition from deep intelligence (Navy) to grounded action (Desaturated Terra).

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined by background shifts or tonal transitions. To separate a section, move from `surface` to `surface-container-low`.

### Surface Hierarchy & Nesting
We treat the UI as a physical desk.
1.  **The Base (The Floor):** The Navy to Terra gradient background.
2.  **The Floating Layer (The Glass):** Sidebars and Topbars using `rgba(255, 255, 255, 0.7)` with a `backdrop-filter: blur(20px)`.
3.  **The Data Layer (The Paper):** `surface-container-lowest` (#ffffff) for high-contrast data entry and reading.
4.  **The Interactive Layer (The Ink):** `primary` (#000000) and `surface-tint` (#9a442d) for CTA and primary actions.

### Signature Textures
Main CTAs should utilize a subtle linear gradient from `primary` to `primary_container` to provide a "weighted" feel that flat hex codes cannot replicate.

---

## 3. Typography: The Editorial Voice
We utilize a pairing of **Manrope** for expressive display and **Inter** for precision data.

*   **Display & Headlines (Manrope):** Large, bold, and authoritative. These should have slightly tighter letter-spacing (-0.02em) to feel like a high-end academic journal.
    *   *Display-lg:* 3.5rem (The Hero Statement)
    *   *Headline-md:* 1.75rem (Section Anchors)
*   **Body & Labels (Inter):** Optimized for legibility in dense tables.
    *   *Body-md:* 0.875rem (Standard Data)
    *   *Label-md:* 0.75rem (Metadata and Captions)

The contrast between the "character" of Manrope and the "invisibility" of Inter creates a professional, editorial hierarchy.

---

## 4. Elevation & Depth
Depth in this system is achieved through **Tonal Layering**, not structural lines.

*   **The Layering Principle:** Place a `surface-container-lowest` card on a `surface-container-low` section. This creates a soft "lift" that feels integrated into the environment.
*   **Ambient Shadows:** Floating glass elements (Sidebars/Topbars) must use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.06)`. The shadow must feel like a soft glow rather than a dark outline.
*   **The "Ghost Border" Fallback:** If a divider is essential for accessibility, use the `outline_variant` token at **15% opacity**. Never use a 100% opaque border.
*   **Glassmorphism Specs:** Floating containers use `rgba(255, 255, 255, 0.7)` with a `3xl` (3rem) corner radius. This high radius is critical to softening the "utility" feel of the dashboard.

---

## 5. Components

### Floating Glass Sidebar
*   **Background:** White 70% opacity + 20px Blur.
*   **Rounding:** `xl` (3rem).
*   **Spacing:** Floats 2rem from the screen edge.
*   **Interaction:** Active states use a `secondary_fixed` (#d7e2ff) background with no border.

### Solid Data Cards
*   **Background:** `surface-container-lowest` (#ffffff).
*   **Rounding:** `lg` (2rem).
*   **Shadow:** Ambient shadow only (0 8px 30px rgba(0,0,0,0.04)).
*   **Content:** No dividers. Use `body-md` for text and 2rem vertical padding to separate data points.

### Glass Pills & Badges
*   **Visuals:** Semi-transparent versions of `secondary_container` with `full` rounding. These should "absorb" the background color they sit on.

### Buttons & Actions
*   **Primary:** Solid `primary` (#000000) or Terra accent (`surface-tint` #9a442d) for high-priority actions.
*   **Secondary/Glass:** A glass button variant (white 40% opacity) for secondary navigation within the topbar.

### Input Fields
*   **Surface:** `surface_container_low` (#f3f4f5).
*   **Active State:** Transitions to a "Ghost Border" of `primary` at 20% opacity.
*   **Typography:** Label must be `label-md` in `on_surface_variant`.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use overlapping elements. A data card can slightly "peek" under the glass topbar to emphasize depth.
*   **Do** use white space as a structural element. If in doubt, increase the padding by 1rem.
*   **Do** use `manrope` for any text that is meant to be "read" (headlines), and `inter` for any text that is meant to be "used" (data).

### Don’t:
*   **Don’t** use black (#000000) for text. Use `on_surface` (#191c1d) to maintain the premium, soft aesthetic.
*   **Don’t** use standard "Drop Shadows." If the shadow is easily visible, it is too heavy.
*   **Don’t** use 1px dividers in lists. Use a 16px vertical gap instead.
*   **Don’t** dock the sidebar to the side of the browser. It must always float with a visible margin to maintain the "Glassmorphism" effect.