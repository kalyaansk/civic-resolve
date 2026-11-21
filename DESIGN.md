# Design System: CivicResolve

**Stitch Project:** `CivicResolve` (`projects/12636128838917717227`)  
**Stitch Project URL:** https://stitch.withgoogle.com/projects/12636128838917717227  
**Stitch Design System Asset:** `assets/11354392866846594236` (`CivicResolve Civic-Tech Design System`)

## Generated Screens Inventory

| Route | Screen Title | Stitch Screen ID | Device / Render Size |
| :--- | :--- | :--- | :--- |
| `/` | Public Issue Tracking Dashboard | `045952696eec4387859b109c8f53018c` | `DESKTOP` (`2560 × 3740`) |
| `/report` | Report a Civic Issue | `56def13e13bd44c3a579f0054bb02412` | `DESKTOP` (`2560 × 3498`) |
| `/issues/[id]` | Issue #CR-2026-0418 - Detail & Tracking | `37e66b1543004efd84ab26bba1caa818` | `DESKTOP` (`2560 × 4710`) |
| `/admin` | Municipal Admin Operations Console | `48cd92602ef645eeb685b86160dfa391` | `DESKTOP` (`2560 × 2882`) |

---

## 1. Visual Theme & Atmosphere

CivicResolve uses a **crisp, high-trust civic-tech light theme** inspired by modern public-service portals and Open311 transparency dashboards. The visual language balances authoritative municipal clarity (deep slate/navy headers and crisp tabular metrics) with approachable neighborhood usability (generous whitespace, clean 16:9 field photography, and distinct teal-accented AI triage insights).

* **Mood & Density:** Airy, structured, and scannable. Public views favor generous breathing room (`24px`–`32px` grid gaps) and 3-column card clarity; the admin operations console increases information density while preserving row readability (`14px` padding) and visual separation via subtle elevation and soft tonal containers.
* **Accessibility-First Philosophy (WCAG 2.1 AA):** Every foreground/background text pairing maintains at least **4.5:1 contrast** (3:1 for large display headings and non-text UI boundaries). Status, priority, and AI classification cues **never rely on color alone**—every indicator pairs a dedicated vector icon (`Material Symbols Outlined` / `lucide-react`) with explicit text labels.

---

## 2. Color Palette & Semantic Roles (WCAG 2.1 AA)

Stitch synthesized a Material/Tailwind token set (`FIDELITY` variant) seeded from `#1B365D` (Primary Civic Navy), `#0F766E` (Civic Teal), `#0369A1` (Civic Blue), and `#0F172A` (Deep Slate Neutral). Both the Stitch generated theme tokens and the canonical WCAG AA implementation hexes are documented below.

### Core Brand & Interactive Accents

| Semantic Token | Descriptive Name | Hex Value | Stitch Token Alias | Contrast / Functional Role |
| :--- | :--- | :--- | :--- | :--- |
| `--brand-navy-deep` | Midnight Civic Navy | `#002046` | `primary` | High-emphasis primary buttons hover, deep authority headings (~15.8:1 on `#FFFFFF`) |
| `--brand-navy` | Deep Civic Navy | `#1B365D` | `primary-container` | Primary CTA buttons (`Report an Issue`, `Submit`), active nav indicators, logo shield (~12.2:1 on `#FFFFFF`) |
| `--brand-navy-soft` | Mist Indigo Tint | `#D6E3FF` | `primary-fixed` | Soft navy badge fills, active row focus wash, subtle icon containers (text `#001B3D` / `#1B365D`) |
| `--brand-teal` | Civic Emerald Teal | `#006A63` / `#0F766E` | `secondary` | Gemini AI Triage accents, live operational pulse dots, sparkles highlights (~5.4:1–6.4:1 on `#FFFFFF`) |
| `--brand-teal-tint` | Mint Seafoam Container | `#99EFE5` / `#CCFBF1` | `secondary-container` | Gemini AI confidence pills, live status chips, SLA success indicators (text `#006F67` / `#00201D`) |
| `--brand-blue` | Civic Sky Blue | `#0369A1` | `tertiary` / override | Interactive links, focus rings, map location pins, secondary interactive cues (~5.9:1 on `#FFFFFF`) |
| `--brand-blue-soft` | Ice Sky Tint | `#CDE5FF` | `tertiary-fixed` | Soft informational callouts and `Reported` status container tint (text `#001D32`) |

### Neutral Surfaces & Text Hierarchy

| Semantic Token | Descriptive Name | Hex Value | Stitch Token Alias | Contrast / Functional Role |
| :--- | :--- | :--- | :--- | :--- |
| `--bg-canvas` | Cool Alabaster / Crisp Canvas | `#F8FAFC` (Stitch: `#FAF8FF`) | `background` / `surface` | Page background canvas creating gentle separation beneath pure white elevated cards |
| `--surface-card` | Pure Porcelain White | `#FFFFFF` | `surface-container-lowest` | Elevated cards, KPI tiles, report form container, table surface, slide-over drawer |
| `--surface-subtle` | Soft Frost Slate | `#F2F3FF` / `#F1F5F9` | `surface-container-low` | Form input fills, filter bar controls, inset AI reasoning callouts, alternating row washes |
| `--surface-tint-mid` | Pale Periwinkle Surface | `#EAEDFF` / `#E2E8F0` | `surface-container` | Secondary buttons, segmented toggle tracks, badge neutral backgrounds |
| `--surface-tint-high` | Muted Lavender-Slate | `#E2E7FF` / `#DAE2FD` | `surface-container-high` | Hover states on secondary controls, active pill chips, table header backgrounds |
| `--text-primary` | Deep Slate Ink | `#0F172A` (Stitch: `#131B2E`) | `on-surface` / `on-background` | Primary headings, card titles, KPI metrics, primary table cell data (>16:1 on `#FFFFFF`) |
| `--text-secondary` | Charcoal Slate | `#44474E` / `#475569` | `on-surface-variant` | Body paragraphs, complaint descriptions, form labels, table secondary metadata (~8.5:1 on `#FFFFFF`) |
| `--text-muted` | Cool Steel Gray | `#64748B` / `#74777F` | `outline` | Timestamps, helper captions, character counters (>= 4.5:1 on `#FFFFFF` and `#F8FAFC`) |
| `--border-hairline` | Crisp Slate Hairline | `#E2E8F0` / `#C4C6CF` | `outline-variant` | 1px card borders, navbar bottom divider, table row dividers, input boundaries |
| `--focus-ring` | High-Visibility Civic Ring | `#0369A1` (or `#006A63`) | `ring-secondary` / `ring-primary` | 2px keyboard focus ring (`focus-visible:ring-2 focus-visible:ring-offset-2`) |

### Semantic Status & Error Tokens

| Semantic Token | Descriptive Name | Hex Value | Stitch Token Alias | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `--status-error` | Crimson Alert | `#BA1A1A` | `error` | Critical alerts, destructive delete icons, error validation states |
| `--status-error-bg` | Blush Alert Tint | `#FFDAD6` / `#FEF2F2` | `error-container` | Critical priority badge surface (paired with `#93000A` / `#991B1B` text) |

---

## 3. Non-Color Badge System & Accessibility Rules

Every status and priority pill uses **`rounded-full` (pill-shaped)** geometry, **`1px` border**, **`12px` semibold typography**, and a **mandatory leading `14px`–`16px` icon** paired with descriptive text so color-blind and screen-reader users never rely on hue alone.

### Issue Status Badges

| Status | Required Icon | Text Hex | Background Hex | Border Hex | Contrast (Text on Bg) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Reported** | `flag` (Flag icon) | `#1E40AF` | `#EFF6FF` | `#BFDBFE` | ~8.0:1 (AAA) |
| **In Progress** | `schedule` / `sync` (Clock or Wrench/Sync icon) | `#92400E` | `#FFFBEB` | `#FDE68A` | ~7.0:1 (AAA) |
| **Resolved** | `check_circle` (Check-circle icon) | `#065F46` | `#ECFDF5` | `#A7F3D0` | ~7.6:1 (AAA) |

### Priority Badges

| Priority | Urgency Range | Required Icon | Text Hex | Background Hex | Border Hex | Contrast |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Critical** | `90–100` | `report` (Octagon-alert icon) | `#991B1B` (Stitch: `#93000A`) | `#FEF2F2` (`#FFDAD6`) | `#FECACA` | ~7.5:1 (AAA) |
| **High** | `70–89` | `warning` (Warning-triangle icon) | `#9A3412` | `#FFF7ED` | `#FED7AA` | ~6.9:1 (AA+) |
| **Medium** | `40–69` | `remove_circle_outline` (Minus-circle icon) | `#854D0E` | `#FEFCE8` | `#FEF08A` | ~6.4:1 (AA+) |
| **Low** | `1–39` | `arrow_downward` (Arrow-down icon) | `#334155` | `#F1F5F9` | `#CBD5E1` | ~9.3:1 (AAA) |

### AI & Utility Tags

* **AI Department Pill:** Leading `auto_awesome` / `sparkles` icon in Civic Teal (`#0F766E` / `#006A63`) + prefix `AI: <Department>` on subtle teal/frost container (`#CCFBF1` / `#F0FDFA` or `#EAEDFF`) with `#0F172A` or `#006F67` text.
* **Urgency Score Meter (1–100):** Tabular numeric score (`84 / 100`) paired with a horizontal segmented progress bar showing threshold stops (`0–39` Low, `40–69` Medium, `70–89` High, `90–100` Critical) and an explicit text label so magnitude is clear numerically and visually.
* **Interactive Community Upvote Pill:** Up-arrow icon (`arrow_upward` / `thumb_up`) + tabular integer count (`47`), minimum `36px`–`40px` touch/click height, explicit `aria-label="Upvote issue, current count 47"`.

---

## 4. Typography Scale

Generated with **Plus Jakarta Sans** for headings/display clarity and **Inter** for UI controls, body copy, and dense administrative tables, paired with `JetBrains Mono` / monospace for issue IDs (`#CR-2026-0418`) and GPS coordinates.

| Level / Token | Font Family | Size | Weight | Line Height | Letter Spacing | Usage |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `display-lg` | Plus Jakarta Sans | `32px` (`2rem`) | `700` (Bold) | `40px` (`1.25`) | `-0.02em` | Primary page titles (`Public Issue Tracking Dashboard`, `Admin Management Dashboard`) |
| `headline-lg` | Plus Jakarta Sans | `24px` (`1.5rem`) | `700` (Bold) | `32px` (`1.33`) | `-0.015em` | Issue detail H1, major section headers, large KPI metric figures (`24px`–`30px` `tabular-nums`) |
| `headline-md` | Plus Jakarta Sans | `20px` (`1.25rem`) | `600` (Semibold) | `28px` (`1.40`) | `-0.01em` | Brand wordmark, Gemini AI Triage header, drawer headings |
| `headline-sm` | Plus Jakarta Sans | `16px` (`1rem`) | `600`–`700` | `24px` (`1.50`) | `0` | Issue card titles, form card headings, timeline section headers |
| `body-lg` | Inter | `16px` (`1rem`) | `400` (Regular) | `24px` (`1.50`) | `0` | Page lead subtitles, complaint detail full narrative |
| `body-md` | Inter | `14px` (`0.875rem`) | `400` (Regular) | `20px` (`1.43`) | `0` | Standard body text, form input values, table cell text, timeline descriptions |
| `body-sm` | Inter | `12px` (`0.75rem`) | `400`–`500` | `18px` (`1.50`) | `0` | Card descriptions (`line-clamp-2`), helper hints, address/timestamp metadata |
| `label-lg` | Inter | `14px` (`0.875rem`) | `600` (Semibold) | `20px` (`1.43`) | `0` | Primary buttons, nav links, form field labels |
| `label-md` | Inter | `12px` (`0.75rem`) | `600` (Semibold) | `16px` (`1.33`) | `0` | Status/priority badges, dropdown triggers, filter pills, table column headers |
| `label-sm` | Inter | `11px` (`0.6875rem`) | `600` (Semibold) | `14px` (`1.27`) | `+0.02em` | Uppercase KPI labels (`TOTAL REPORTED`), compact confidence chips, SLA footnotes |
| `mono-id` | Monospace (`ui-monospace`) | `12px` | `600` (Semibold) | `16px` | `-0.01em` | Complaint IDs (`#CR-2026-0418`), GPS coordinates (`40.7128° N, 74.0060° W`) |

**Numeric Discipline:** Apply `font-variant-numeric: tabular-nums` (`tabular-nums`) to all KPI counts, urgency scores (`1–100`), upvote counters, and timestamps to prevent layout shift and align table columns cleanly.

---

## 5. Spacing, Layout Grid & Responsive Breakpoints

### Spacing Scale (4px Base Unit)

| Token | Value | Stitch / Tailwind Mapping | Typical Application |
| :--- | :--- | :--- | :--- |
| `space-xs` | `4px` (`0.25rem`) | `gap-1` / `p-1` | Tight icon-to-label gap inside micro-chips |
| `space-sm` | `8px` (`0.5rem`) | `gap-2` / `p-2` | Badge internal spacing, form label to input margin |
| `space-md` | `16px` (`1rem`) | `gap-4` / `p-4` | Compact KPI padding, table cell horizontal padding, stacked mobile gutters |
| `space-lg` | `24px` (`1.5rem`) | `gap-6` / `p-6` | Standard card padding (`24px`), dashboard card grid gap, desktop container horizontal padding (`px-6`) |
| `space-xl` | `32px` (`2rem`) | `gap-8` / `py-8` | Two-column split gap (`gap-8`), vertical section spacing between KPI strip, filter bar, and content |
| `space-2xl` | `48px` (`3rem`) | `lg:px-12` / `py-12` | Large desktop horizontal outer gutter (`48px` at `lg`), footer separation |

### Page Container & Breakpoint Strategy

* **Max Container Width:** `1280px` (`max-w-7xl`) centered (`mx-auto`), with `24px` (`px-6`) horizontal padding on mobile/tablet and `48px` (`lg:px-12`) on wide desktop.
* **Breakpoints:**
  * **Mobile (`< 640px`):** Single-column stacked layout (`grid-cols-1`), collapsible mobile navigation menu with persistent `Report an Issue` CTA, full-width stacked form + AI Triage card (`/report`), full-width resolution drawer/modal on `/admin`.
  * **Tablet (`640px` – `1023px`):** 2-column KPI grid (`sm:grid-cols-2`), 2-column issue card grid (`md:grid-cols-2`), stacked detail and reporting columns until `lg`.
  * **Desktop (`>= 1024px`, `lg:`):** Full 12-column CSS grid (`grid-cols-12`):
    * `/`: 4-column KPI row (`lg:grid-cols-4`), 3-column Issue Card Grid (`lg:grid-cols-3`).
    * `/report`: 7-column Form + 5-column Sticky Gemini AI Triage Card (`lg:col-span-7` / `lg:col-span-5`, ~60/40 split, `sticky top-24`).
    * `/issues/[id]`: 8-column Evidence & AI Breakdown + 4-column Vertical Status Timeline (`lg:col-span-8` / `lg:col-span-4`, ~65/35 split).
    * `/admin`: ~62% Complaints Table + ~38% Slide-Over Resolution Drawer (`lg:col-span-7` / `lg:col-span-5` when drawer is open, or full 12 cols when closed).

---

## 6. Border Radii & Elevation / Shadow Tokens

CivicResolve maintains **softly rounded (`8px` base)** structural geometry across inputs and buttons, paired with **generously rounded (`12px`–`16px`)** cards and **pill-shaped** badges.

### Border Radii

| Element Type | Physical Description | CSS / Tailwind Value |
| :--- | :--- | :--- |
| Standard inputs, selects, small buttons | Subtly rounded (`ROUND_EIGHT` base) | `8px` (`rounded-lg`) |
| Elevated cards, issue thumbnails, AI callouts, modals/drawers | Generously rounded | `12px`–`16px` (`rounded-xl` / `rounded-2xl`) |
| Segmented toggle active tab, compact table ID chips | Slightly rounded | `4px`–`6px` (`rounded` / `rounded-md`) |
| Status badges, priority badges, AI department tags, upvote pills | Pill-shaped | `9999px` (`rounded-full`) |

### Elevation & Shadows

* **Flat Canvas (`none`):** Page background (`#F8FAFC`) and inset form fields (`#F2F3FF` / `#F1F5F9`) rely on subtle surface tint shifts rather than drop shadows.
* **Sticky Navbar (`shadow-nav`):** `0 1px 8px rgba(0, 0, 0, 0.04)` paired with `backdrop-blur-md` (`bg-white/95`) and a `1px` bottom hairline border (`#E2E8F0`).
* **Whisper-Soft Card Elevation (`shadow-sm`):** `0 1px 2px rgba(15, 23, 42, 0.05)` + `1px solid #E2E8F0` border for KPI tiles, issue cards, complaint summary, and timeline cards. Hover state lifts subtly to `shadow-md` (`0 4px 12px rgba(15, 23, 42, 0.08)`).
* **Highlighted AI Panel (`shadow-md`):** Soft gradient container (`from-[#F2F3FF] via-white to-white` or `from-teal-50/40 via-white to-white`) with `1px` teal/indigo tint border (`#99EFE5` / `#C4C6CF`) and `0 4px 12px rgba(15, 23, 42, 0.06)`.
* **Slide-Over Drawer / Modal (`shadow-xl`):** `0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 8px 10px -6px rgba(15, 23, 42, 0.1)` with crisp `#E2E8F0` left border.

---

## 7. Component & Screen Layout Specifications

### Shared Navigation Shell
* **Height:** `64px` (`h-16`), sticky (`sticky top-0 z-50`).
* **Left Zone:** Shield + location-pin vector brand mark + `CivicResolve` (`Plus Jakarta Sans` `20px` Bold `#1B365D`) + live operational status pill (`Civic Pulse`).
* **Center-Left Links:** `Track Issues` (`/`), `Admin Console` (`/admin`). Active route uses bold `#1B365D` text and a `2px` bottom border indicator (`border-b-2 border-[#1B365D]`).
* **Right Actions:** `Sign In` secondary outline button (or signed-in operator chip `M. Alvarez • Ops Lead` on `/admin`) + primary `#1B365D` CTA button `Report an Issue` (`/report`) with leading `+` icon.

### Screen 1: Public Issue Tracking Dashboard (`/`)
* **KPI Summary Strip:** 4 equal cards (`Total Issues`, `Reported`, `In Progress`, `Resolved`), each containing a soft-tinted `40px × 40px` rounded icon box, uppercase `11px` label, `28px`–`30px` tabular metric, and contextual delta/rate pill.
* **Filter & View Bar:** White card container housing a flex-wrap toolbar: search input (`flex-1 min-w-[240px]`), `Status`, `Priority`, and `Category` select dropdowns, sort selector, and a segmented `List View` / `Interactive Map View` toggle with clear active dark-navy pill (`#1B365D` or `#002046` with white text).
* **Issue Card Anatomy:**
  1. `16:9` photo header (`object-cover`) with subtle issue ID overlay pill or header metadata.
  2. Status badge + Priority badge row (`flex-wrap gap-2`) using icon + text pills.
  3. Title (`16px` Bold `#0F172A`) + 2-line truncated description (`12px` `#475569`) + street address with `location_on` pin & relative time.
  4. Top-bordered footer row (`border-t border-slate-200 pt-3`) with `AI: <Department>` pill (`sparkles` icon) on the left and interactive `▲ <count>` community upvote pill on the right.

### Screen 2: Citizen Issue Reporting Page (`/report`)
* **Left Column (`7/12` cols):** Single elevated white card (`p-6 sm:p-8 rounded-2xl`) with vertically stacked fields: `Issue Title`, `Detailed Description` (with `X / 1,000` live character counter), `Incident Location` (street input + `Use My Location` GPS button + interactive street map canvas with draggable pin, `+`/`-` zoom controls, and live lat/lng pill), `Category (Optional)` (`Auto-detect with Gemini AI` default), and `Photo Evidence` dashed drag-and-drop dropzone + uploaded file preview card with thumbnail, EXIF/size info, and remove action.
* **Right Column (`5/12` cols, `lg:sticky lg:top-24`):** **Gemini AI Triage Card** featuring sparkles header + pulsing `Live Analysis` badge, `AI-Detected Category` + confidence pill (`96% Conf.`), `Priority` icon badge + `Urgency Score: XX / 100` linear gradient bar with Low/Med/High/Critical threshold ticks, `Recommended Municipal Department` + SLA pill, inset `Triage Rationale` reasoning card, and Open311 human-review transparency notice.

### Screen 3: Issue Detail & Tracking Timeline (`/issues/[id]`)
* **Issue Header:** Breadcrumb (`Track Issues / Issue #CR-2026-0418`), monospace issue ID chip, `24px`–`30px` H1 title, Status + Priority + AI Department badge strip, and right-aligned `Upvote` & `Share` buttons.
* **Left Column (`8/12` cols):** Uploaded photo card with verified geo/timestamp bar → Complaint Summary card with 2×2 metadata grid (`Category`, `Location`, `Assigned Department`, `Reporter`) → Highlighted **Gemini AI Analysis Breakdown** box (confidence badge, 1–100 score meter, bulleted reasoning) → Embedded Map Location Preview card with `Open in Maps` action.
* **Right Column (`4/12` cols):**
  * **Tracking Timeline Card:** Vertical progress stepper connected by a `2px` vertical rail (`left-3`). Completed nodes use solid icon circles (`Reported`), active current stage uses a ringed pulsing node (`In Progress`), and upcoming stages use dashed outline circles (`Resolved`). Every entry shows timestamp, stage title, and crew/dispatch summary.
  * **Municipal Department & SLA Card:** Department ownership, target response SLA, and Open311 reference number.

### Screen 4: Admin Management Dashboard (`/admin`)
* **Operations KPI Strip:** 4 compact triage cards (`Critical Queue`, `Unassigned Reports`, `Avg Response Time`, `Resolved Today`).
* **Queue Controls Bar:** Search by ID/street, `Department`, `Status`, and `Priority` dropdowns, explicit `Sorted: Urgency Score High → Low` badge, and `Export CSV` outline button.
* **Urgency-Sorted Table & Resolution Drawer Split:**
  * **Table:** Rows strictly ordered descending by Gemini AI Urgency Score (`1–100`). Columns: `Urgency & Priority` (tabular numeric score + icon badge), `Complaint & Location` (ID + title + district), inline `Department` reassignment dropdown, inline `Status` dropdown (preserving icon + text clarity), and `Resolution Note` action button. Selected row displays a crisp `#1B365D` highlight ring/wash.
  * **Slide-Over Resolution Note Drawer:** Right-docked elevated panel (`shadow-xl rounded-2xl`) displaying active ticket context + AI urgency summary, `Update Status` selector, `Reassign Department` selector, `Public Resolution Note` textarea, optional proof-photo attachment preview, citizen notification & public transparency checkboxes, and sticky `Cancel` / `Save & Publish Update` footer actions.
