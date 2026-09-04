# design.md

## The Best Board Meeting You’ve Ever Had

This document is the canonical design system for the MVP web app. It is the source of truth for all product and design implementation work. If a design decision is not covered elsewhere, follow this file.

The product should feel like a **retro-cool executive computing environment**: inspired by the heyday of Xerox PARC, editorial technology magazines, and 1970s–1980s research-lab optimism, translated into a usable modern web app.

It must feel:
- thoughtful, intelligent, and high-taste
- slightly theatrical, but never gimmicky
- warm and human, not cold enterprise SaaS
- historical in spirit, modern in usability
- like a boardroom and a research workstation combined

It must not feel like:
- a generic AI chat app
- a crypto dashboard
- a poker table or casino UI
- a whimsical game
- shiny “AI slop” futurism
- Apple glassmorphism or generic startup minimalism

---

## 1. Core visual idea

The product has three modes:

1. **Selection** — an editorial catalog of board members and meeting setup.
2. **Boardroom** — a dark, dramatic, conversational room with a central table.
3. **Readout** — a crisp paper-like executive memo.

The core contrast of the product is:
- **paper + index cards + editorial typography**
- **versus**
- **dark room + illuminated table + live conversation**

Design should borrow from Xerox PARC references in these ways:
- oversized bold sans-serif headlines
- mono and serif accents used sparingly
- strong editorial composition
- black / off-white / warm gray foundations
- accent colors drawn from vintage computing and printed ephemera
- framed image areas and caption-like metadata
- visible structure, grids, and labels
- tactile panels that feel like printed boards or instrument surfaces

Do **not** literally mimic Xerox hardware UI or turn the app into a museum artifact.

---

## 2. Design principles

### 2.1 Start from the decision
Every screen should make the decision feel central. The user is here to make a consequential choice, not to browse AI features.

### 2.2 Design for “room presence”
The meeting screen should feel like entering a place. Participants occupy seats. Speech appears in a shared conversational record. The center of the room matters.

### 2.3 Editorial, not app-storey
Prefer layouts that feel authored and composed rather than “box of cards” SaaS defaults.

### 2.4 Use tension, not clutter
Large type, strict alignment, and contrasting materials should create character. Do not add decoration to compensate for weak composition.

### 2.5 Distinct people, distinct seats
Agents are not abstract bubbles. Their presence should be visually legible through portraits, nameplates, and seat states.

### 2.6 Calm interaction over maximal animation
Motion is supportive. It should clarify joining, speaking, reacting, and summarization, but never dominate the screen.

---

## 3. Color system

Use a restrained palette with strong material contrast.

### 3.1 Foundations
- **Ink** `#121110` — primary dark background
- **Coal** `#1B1917` — elevated dark surfaces
- **Paper** `#F2EEE6` — primary light background
- **Warm Paper** `#E7DFD1` — secondary light surface
- **Graphite** `#3B3630` — borders, nameplates, dividers
- **Fog** `#C8BFB1` — subdued text on light surfaces
- **Ash** `#8D857A` — secondary text

### 3.2 Accent colors
Use sparingly. Accents are for emphasis, identity tags, selected states, and structural highlights.

- **Signal Orange** `#D96A1B`
- **PARC Olive** `#8F9770`
- **Terminal Blue** `#587A8D`
- **Oxide Red** `#A54B34`
- **Soft Gold** `#B58A3A`

### 3.3 Usage rules
- The boardroom uses mostly Ink, Coal, Paper, and one accent at a time.
- Selection and readout screens are mostly Paper / Warm Paper.
- Do not show all accent colors equally on one screen.
- Avoid bright saturated rainbow agent colors.
- Selected items may use accent borders or fills.
- Error states should use Oxide Red.

---

## 4. Typography

Use a small, fixed type system.

### 4.1 Fonts
- **Display / editorial serif:** Instrument Serif or similar high-contrast serif
- **Primary sans:** Geist Sans, Inter, or a similarly neutral grotesk
- **Monospace:** Geist Mono or IBM Plex Mono

### 4.2 Role mapping
- **Hero / room title:** serif
- **Section headers / labels / UI chrome:** sans
- **Metadata / timestamps / transcript utilities:** mono sparingly

### 4.3 Type scale
- Display XL: 72 / 0.95 / tight
- Display L: 56 / 0.98
- H1: 40 / 1.0
- H2: 28 / 1.1
- H3: 22 / 1.15
- Body L: 18 / 1.45
- Body: 16 / 1.5
- Small: 14 / 1.45
- Meta: 12 / 1.35

### 4.4 Typography rules
- Use sentence case, not all caps for major headings.
- Short labels or index markers may be uppercase.
- Big editorial headlines are encouraged on onboarding and readout.
- Meeting transcript text should stay readable and neutral.
- Never use more than 3 type sizes in one local UI cluster.

---

## 5. Layout system

### 5.1 Grid
- Desktop-first MVP.
- 12-column grid.
- Max content width: 1440px.
- Outer margin: 32–48px desktop.

### 5.2 Rhythm
Use generous spacing and clear visual pauses.
- micro: 4
- xs: 8
- sm: 12
- md: 16
- lg: 24
- xl: 32
- 2xl: 48
- 3xl: 64
- 4xl: 96

### 5.3 Shape
- Primary radius: 18px
- Small radius: 10px
- Sharp corners allowed for editorial frames and labels
- Use mostly one radius family per screen

### 5.4 Borders and shadows
- Thin visible borders are encouraged
- Use layered shadows sparingly
- Surfaces should feel tactile, not glossy
- Avoid soft floating SaaS card shadows everywhere

---

## 6. Materials

There are three primary materials:

### 6.1 Paper
Used for:
- onboarding
- board member cards
- decision briefing
- readout memo

Traits:
- warm off-white background
- subtle border
- clean typography
- editorial layouts

### 6.2 Room
Used for:
- live meeting canvas

Traits:
- dark background
- focused lighting
- central table or central agenda plane
- contrast between dark room and lighter participant or transcript surfaces

### 6.3 Machine panel
Used for:
- utility bars
- invite modules
- agent join controls
- compact meta blocks

Traits:
- darker or olive/graphite panels
- precise labels
- slightly industrial feel

---

## 7. Screen compositions

### 7.1 Board selection
Purpose: choose 3–6 board members.

Composition:
- left rail or header with product title and short explanation
- large searchable editorial library of guests
- selected board shown as a horizontal strip or staged seats
- each member card shows portrait, name, one-line descriptor, and source note
- CTA to continue

Desired feeling:
- like curating an advisory board from a founder archive
- high-taste editorial browsing

### 7.2 Decision briefing
Purpose: explain what decision the user is trying to make.

Composition:
- large prompt area for the decision
- optional context area beneath
- right-side preview of selected board members
- clear CTA to start meeting

Desired feeling:
- the user is drafting a board memo before a real meeting

### 7.3 Live board meeting
Purpose: the main product moment.

Composition:
- central board table as primary focal object
- 3–6 participant seats arranged around the table
- optional guest seat for personal agent
- a live minutes panel / transcript panel visible as part of the same room
- center area includes the agenda or question under discussion
- participant seats show portrait, name, speaking / listening state, and reaction status
- chair controls and “Invite your agent” action are visible but not dominant

Desired feeling:
- an intimate, premium boardroom
- not a chat app skin
- the room itself is the product

### 7.4 WebMCP join state
Purpose: show Codex visibly joining.

Composition:
- empty guest seat becomes active
- invitation module generates a meeting link / prompt
- transient join event is visibly logged in the room
- Codex seat appears with its own nameplate and avatar
- assistant contributes context into the live minutes

Desired feeling:
- like a chief of staff or assistant has entered the room
- eventful but controlled

### 7.5 Executive readout
Purpose: summarize the meeting.

Composition:
- paper-like report
- recommendation or “board divided” outcome at top
- sections for options, tradeoffs, assumptions, open questions, next actions, and closing comments
- closing comments can use small adviser callouts

Desired feeling:
- a board memo worth saving
- crisp and authoritative

---

## 8. Components

### 8.1 Product wordmark
Use a clean wordmark treatment in sans. Optional small serif subtitle.

### 8.2 Member card
Contains:
- portrait
- name
- short descriptor
- episode/source line
- selection state

### 8.3 Selected board strip
A compact row of selected participants. Shows count and remaining seat capacity.

### 8.4 Participant seat
Contains:
- circular or slightly squared portrait
- nameplate
- status indicator
- subtle reaction affordance

States:
- idle
- thinking
- ready
- speaking
- reacting
- invited
- joined externally

### 8.5 Board table
The symbolic center of the room. Can be oval or rounded-rect.
Must contain:
- current decision title
- optional key topic or prompt
- subtle progress / meeting phase cues

### 8.6 Minutes panel
The canonical transcript surface.
Contains:
- ordered conversation entries
- speaker identity
- content
- timestamps optional
- summary markers / synthesis messages visually distinct

### 8.7 Chair controls
Small control group for:
- start meeting
- end meeting
- invite your agent
- nudge or @mention affordance

### 8.8 Agent invite module
A machine-panel style component that shows:
- invite your agent
- generated prompt or deep link
- status: waiting / joining / joined

### 8.9 Readout sections
Sections for:
- recommendation
- options considered
- tradeoffs
- assumptions
- open questions
- next actions
- closing comments

---

## 9. Participant identity system

### 9.1 Portraits
Use portraits when available. Portraits should feel archival and composed.
- Prefer desaturated or warm-toned treatment.
- Avoid hyper-saturated modern photography.
- Cropping should be clean and respectful.

### 9.2 Nameplates
Nameplates are important.
- dark plate on light surface or light plate on dark surface
- compact and typographic
- can include a small descriptor in meta text

### 9.3 Accent application
Each participant may have a subtle identity accent, but keep it restrained.
- examples: underline, border, dot, small seat glow, or small label fill
- do not color-code the entire interface per agent

---

## 10. Motion

### 10.1 Principles
Motion communicates:
- seat activation
- thinking -> ready
- speaking transitions
- agent joining
- summary generation

### 10.2 Motion style
- short and crisp
- 120–240ms micro transitions
- 300–500ms for larger room events
- ease should feel mechanical / composed, not bouncy

### 10.3 Do not use
- flashy particle effects
- pulsing neon glows
- overscaled spring animations
- gamified reactions

---

## 11. Copy style

Use concise, literate copy.

Preferred tone:
- calm
- direct
- thoughtful
- slightly editorial

Examples:
- “Assemble your board.”
- “What decision are you trying to make?”
- “The room is divided.”
- “Codex has joined the meeting.”
- “Recommendation”
- “Tradeoffs considered”

Avoid:
- hypey AI claims
- playful chatbot copy
- jargon-heavy system language

---

## 12. WebMCP expression

WebMCP is important but should never dominate the product.

Rules:
- Treat it as a product capability, not the main aesthetic motif.
- “Invite your agent” should be legible and compelling.
- When the external agent joins, make the room visibly change.
- The join should feel similar to someone entering a meeting.
- Tool actions should be reflected in the transcript or room events.
- Avoid exposing raw protocol complexity in the main UI.

---

## 13. Accessibility

- Contrast must remain high enough despite the retro palette.
- Transcript text must be easy to read.
- Interactive elements must be clearly focusable.
- Do not rely on accent color alone for status.
- Participant states should have color + label + shape cue.
- Large type should wrap elegantly.

---

## 14. Anti-patterns

Do not ship these:
- generic chat bubbles over a dark background
- default SaaS dashboard card grids
- poker-table felt textures
- fake wood boardroom kitsch
- emoji-heavy reactions
- rainbow gradients
- glassmorphism
- excessive tiny metadata labels everywhere
- retro skeuomorphism so literal it becomes parody
- a design that looks like a museum exhibition site instead of a usable app

---

## 15. Reference mood

The product should feel like a blend of:
- Xerox PARC optimism
- an editorial design annual
- a founder’s private strategy room
- a research lab presentation board
- a well-composed executive memo

If unsure, optimize for:
**editorial intelligence + tactile computing + room presence**.

