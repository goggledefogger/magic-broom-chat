# Enchanted Apothecary Design System

Generated from Google Stitch MCP for the Magic Brooms chat app redesign.

## Stitch Project
- **Project ID:** `3880572934412120172`
- **Design System Asset:** `6841064324871192772`

## Creative North Star: "The Alchemist's Atelier"
A sophisticated botanical dark mode that feels like a candlelit sanctuary. Deep forest greens, luminous emerald accents, and warm amber highlights create an immersive mystical atmosphere.

## Color Tokens

### Surface Hierarchy (Tonal Layering)
| Token | Hex | Role |
|-------|-----|------|
| `surface` | `#08160e` | Base background — the void of the forest |
| `surface-container-lowest` | `#041109` | Input fields, deepest recessions |
| `surface-container-low` | `#101f16` | Sidebar, muted areas |
| `surface-container` | `#14231a` | Secondary surfaces |
| `surface-container-high` | `#1e2d24` | Cards, elevated elements |
| `surface-container-highest` | `#29382f` | Popovers, hover states, modals |

### Semantic Colors
| Token | Hex | Role |
|-------|-----|------|
| `primary` | `#86d7ad` | Buttons, links, active states |
| `primary-container` | `#4fa07a` | Gradient end, subtle accents |
| `secondary` (amber) | `#f0bd8b` | Badges, notifications, amber links |
| `tertiary` (gold) | `#e7c268` | Special headers, premium indicators |
| `on-surface` | `#d5e7d9` | Primary text (soft sage white) |
| `on-surface-variant` | `#bec9c0` | Muted text |
| `outline-variant` | `#3f4943` | Ghost borders (use at 15% opacity) |
| `error` | `#ffb4ab` | Destructive actions |

## Typography
- **Headlines:** Sora — geometric, modern, slightly mystical
- **Body:** DM Sans — clean readability at small sizes
- **Labels:** DM Sans uppercase with wider tracking

## Key Design Rules
1. **No-Line Rule:** No 1px borders for sectioning. Use background color shifts.
2. **Glass & Gradient:** Floating panels use glassmorphism (backdrop-blur + semi-transparent surface).
3. **Emerald Gradient:** Primary CTAs use gradient from `#86d7ad` to `#4fa07a` at 135deg.
4. **No pure white/black:** Text is `#d5e7d9`, shadows tinted with forest green.
5. **12px radius:** All elements use `rounded-lg` (12px) or larger.

## Screens Generated
1. **Login Page** — Frosted glass card on radial gradient background
2. **Chat View** — Sidebar + message list + emerald input
3. **Gallery View** — Pinterest-style card grid with hover glow
4. **Profile Page** — Centered glass card with emerald avatar ring
