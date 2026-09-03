# Design “The Best Board Meeting You’ve Ever Had”

**Status:** Authoritative design guidance for the MVP  
**Audience:** General orchestrator, product-design agent, and all frontend implementation agents  
**Product specification:** `mvp-product-spec-and-build-plan.md`  
**Primary viewport:** 1440 × 900  
**Secondary viewport:** 1280 × 800  

Act as an exceptional product designer, interaction designer, art director, editor, and design engineer. Build a decision room that feels consequential, intimate, and alive. Do not merely apply attractive styling to a chat interface. Shape the room, the conversation, and the final record as one coherent experience.

Use Vercel’s discipline: start from the user’s job, choose a composition specific to the material, turn subjective feedback into observable rules, name recurring failure modes, and review fixed scenarios repeatedly. Use Taste Labs as evidence that a digital product can have a strong point of view, confident typography, deliberate asymmetry, and one memorable interaction without becoming noisy. Copy neither company’s visual identity.

The product specification wins on functionality and scope. This file wins on composition, hierarchy, interaction presentation, copy tone, and visual behavior. When requirements compete, preserve the functional contract first and the design thesis second.

---

## Product and brand context

A founder opens this product while facing a decision that feels important, ambiguous, and slightly lonely. They are not looking for another answer box. They are trying to assemble a room of people whose judgment they respect, explain the problem once, hear distinct views collide, and leave with a clearer course of action.

The product’s central promise is access: convene advisers the user could never ordinarily gather. Its secondary promise is rigor: make assumptions, disagreements, and tradeoffs visible. Its final promise is closure: produce a useful executive readout rather than letting the conversation disappear into chat history.

The MVP has four states:

1. Choose three to six board members.
2. Brief the board on a consequential decision.
3. Chair a live text-based meeting.
4. Leave with an executive readout.

Near the end of the meeting, the user invites their personal agent. In the demo, Codex discovers the page’s WebMCP tools, joins under its own identity, takes a visible seat, contributes context, questions a board member, requests a synthesis, and retrieves the final readout.

The strongest memory after the two-minute demo should be:

> I watched a real room of distinct advisers debate a decision. Then the user’s own agent walked into that same room and became part of the meeting.

Not:

> I watched several chatbots produce text in a polished dashboard.

---

## The design thesis: the room and the record

The experience has two visual worlds and one continuous motif.

### Paper mode

Board selection, the decision brief, and the final readout live on a warm, editorial canvas. Paper mode feels lucid, open, and deliberate. It resembles a beautifully typeset working document, not a productivity dashboard and not fake stationery.

### Room mode

The live meeting takes place in a dark, intimate room around one sculptural table. Room mode feels focused and lightly cinematic. It is not a generic dark theme. Entering the room should feel like the meeting has convened.

### The minutes

A warm paper minutes rail remains visible inside the dark room. It is the bridge between the two worlds: live conversation becomes a record, and the record later expands into the final readout.

### The recurring motif: the nameplate

The same nameplate language connects the product:

- A selected adviser becomes a nameplate in the “Your board” preview.
- The nameplate becomes the person’s seat in the room.
- The same name and portrait identify their comments in the minutes.
- The same identity treatment returns beside their closing comment in the readout.

This continuity should make the experience feel authored as one product, not assembled from separate screens.

### The signature composition

The live meeting is always composed as **room + minutes**:

- The room is the dominant field.
- The table is the dominant object in the room.
- The user’s decision sits at the center of the table as an agenda folio.
- The minutes are a contrasting paper rail, not a chat drawer.
- Speaker identity is synchronized between seat and minutes.

This is the product’s evidence-bearing organizing move. It belongs to this product and should not be replaceable with a standard chat layout without obviously losing meaning.

---

## Priority order

When design requirements compete, protect them in this order:

1. **Make the current task and meeting state unmistakable.** The user must always know what decision is being discussed, who is present, who is speaking, and what they can do next.
2. **Make the room feel inhabited.** The table, seats, portraits, nameplates, and conversational states must create social presence.
3. **Keep the decision central.** The interface should orient every participant around one question rather than around the technology.
4. **Keep identities distinct.** People are differentiated through name, portrait, role, language, and behavior, not arbitrary colors or decorative avatars.
5. **Make the conversation readable at a glance.** The minutes must be easy to follow without turning into speech-bubble clutter.
6. **Make WebMCP participation visible.** The personal agent’s inspection, arrival, contribution, question, synthesis request, and retrieval must be legible without developer tools.
7. **Make the outcome worth keeping.** The readout should feel more like a concise board memo than a generated summary page.
8. **Protect speed and reliability.** No visual flourish may delay a model response, block an action, or make the two-minute demo fragile.
9. **Add delight only after the above are solved.** Presence comes from commitment and coherence, not from more effects.

---

## Observable design decisions

| Principle | Observable outcome |
|---|---|
| The room is the product | In the meeting, the table occupies more visual area than any panel or transcript. |
| The decision is the center of gravity | The question appears on the table in an agenda folio and remains available throughout the meeting. |
| Conversation becomes minutes | Contributions are typeset as editorial entries, never rounded chat bubbles. |
| Board members are people, not model instances | Every contribution is anchored to a portrait, full name, and seat. No model names appear in the user experience. |
| Personality comes from behavior | Do not assign a rainbow color to each adviser or decorate them with archetype icons. |
| Independent thinking is visible | Each seat clearly moves through “Considering privately” to “Ready” before public discussion. |
| Interruption is social, not chaotic | A member who wants to respond receives a small seat-level state and the next turn; no message is cut off mid-stream. |
| The human is chair | The user’s seat is visually privileged, @mentions are easy, and only the human can end the meeting. |
| The external agent truly joins | A guest seat enters or activates, gains a nameplate, and remains present for subsequent discussion. |
| WebMCP is product behavior, not a developer demo | Tool actions create visible room events and participant behavior, not a raw technical log. |
| The meeting leaves a durable artifact | The final state is an editorial readout with a dominant recommendation, tradeoffs, questions, and actions. |
| Restraint is not sterility | One strong table, one paper rail, confident type, and precise motion create presence without ornamental clutter. |

---

## Work in four passes

### 1. Frame the user’s moment

Before designing a state, privately answer:

- What is the user trying to do in the next ten seconds?
- What is the one object that should dominate this state?
- What information must remain available but quiet?
- What change should the user perceive after acting?
- What would make this state look like generic generated software?

The four screen-level jobs are:

| State | The user’s immediate question | Dominant object |
|---|---|---|
| Board selection | Who do I want in the room? | The board preview and adviser catalog |
| Decision briefing | What does my board need to know? | The decision sheet |
| Live meeting | Who is saying what, and how is the board’s thinking changing? | The board table |
| Readout | What should I do, and why? | The board’s recommendation |

Every visible section must answer a new question. Remove duplicate explanation, repeated summaries, and ceremonial setup.

### 2. Choose the composition before the components

Do not begin by assembling cards, dialogs, tabs, and chat bubbles. Establish the page-level field, dominant object, reading path, and density first.

Use these composition rules:

- One dominant object per state.
- One clear primary action per state.
- Supporting information should sit close to the object it qualifies.
- Repeated items receive equal geometry only when they are true peers.
- Open space must amplify a focal object, not expose an underfilled grid.
- Align every object to a shared edge, baseline, grid line, table axis, or deliberate optical center.
- If the design still reads as a conventional SaaS workflow when blurred, revise the topology rather than adding decoration.

Use a squint test. In the meeting, the viewer should see a table with people around it and a minutes sheet. In the readout, they should see one dominant recommendation followed by structured evidence. If all blocks have equal weight, redesign.

### 3. Stage state changes, not decoration

Motion is used to show:

- an adviser being selected and taking a place at the table;
- independent positions becoming ready;
- a speaker taking the floor;
- a participant wanting to respond;
- a personal agent crossing from “invited” to “joined”;
- the minutes becoming the readout.

Do not animate for atmosphere alone. Never make a user wait for an animation to finish before acting.

### 4. Inspect the rendered product

Review real screenshots at the target viewports with realistic names, long copy, streaming text, and all states. Do not approve a component in isolation if the integrated screen has no hierarchy.

Review in this order:

1. Current task and dominant object
2. Social presence and speaker legibility
3. Decision visibility
4. Composition and alignment
5. Typography and reading comfort
6. State and motion clarity
7. WebMCP legibility
8. Restraint
9. Accessibility
10. Demo timing

Fix the highest-impact systemic issue, render again, and repeat.

---

## Visual character

The product should feel:

- **Consequential:** this is a place for decisions with stakes.
- **Intimate:** a private room, not a broadcast stage.
- **Editorial:** ideas and language carry the experience.
- **Composed:** every object has a clear role and position.
- **Alive:** participants react and the room changes without becoming noisy.
- **Modern:** the skeuomorphism is abstract and functional, never nostalgic cosplay.

The product should not feel:

- like a generic AI assistant;
- like Slack, Discord, iMessage, or a group-chat clone;
- like a data dashboard;
- like a video-conferencing grid;
- like a law firm, private bank, country club, or “old money” mood board;
- like a sci-fi command center;
- like a cartoon board game;
- like a celebrity impersonation app;
- like a luxury casino or fantasy sports draft;
- like a demo built around tool calls rather than a human decision.

### The right tension

Combine three sensibilities:

1. **Editorial authority:** excellent typography, decisive scale, lucid copy, quiet rules.
2. **Cinematic presence:** a dark room, one sculptural table, focused lighting, controlled entrances.
3. **Digital precision:** fast state changes, crisp controls, clear tool receipts, no ornamental realism.

The design should be memorable because it makes a digital meeting feel spatial and social, not because it uses a fashionable visual effect.

---

## Color system

Use a warm neutral foundation with two tightly controlled semantic accents.

### Paper mode

| Token | Value | Use |
|---|---:|---|
| Paper canvas | `#F2EEE6` | Full-page background for selection, briefing, and readout |
| Paper sheet | `#FBF9F5` | Minutes rail and rare raised document surfaces |
| Ink | `#171714` | Primary text and dark controls |
| Ink secondary | `#68645C` | Supporting text and metadata |
| Rule | `#D7D0C4` | Dividers, input boundaries, quiet structure |
| Soft fill | `#E8E2D8` | Selected rows, hover states, inactive table preview |

### Room mode

| Token | Value | Use |
|---|---:|---|
| Room canvas | `#10110F` | Full meeting background |
| Room surface | `#171916` | Header and subtle local planes |
| Table top | `#292820` | Main table surface |
| Table edge | `#090A08` | Table depth and underside |
| Room ink | `#F2EEE6` | Primary room text |
| Room secondary | `#AAA79F` | Quiet labels and inactive participant states |
| Room rule | `#34362F` | Hairlines and structural boundaries |

### Semantic accents

| Token | Light value | Room value | Meaning |
|---|---:|---:|---|
| Human action | `#B84432` | `#E16E57` | Selection, chair focus, primary human action |
| Guest agent | `#315EDB` | `#7C9CFF` | External personal agent and WebMCP-originated events |
| Brass detail | `#A88952` | `#A88952` | Table inlay and rare physical detail only |

Rules:

- The board members do not receive individual brand colors.
- The human accent marks intentional user action, not every button.
- The guest-agent accent appears only after the invitation flow becomes relevant.
- Brass is decorative material detail, never body text or a status color.
- Pair every colored state with text, shape, or motion. Never rely on color alone.
- Do not introduce purple, cyan, neon green, or a multi-color AI palette.
- Do not use gradients as ambient decoration.
- A single low-contrast neutral luminance field may sit behind the table to imply room lighting.
- A subtle tonal bevel may define the table plane. Keep both nearly monochrome.
- No gradient text, aurora backgrounds, glowing borders, or colored fog.

Light and room modes are semantic states, not user-selectable themes. Do not add a theme switcher.

---

## Typography

Use typography to create authority before adding surfaces.

### Font families

- **Editorial serif:** Newsreader variable, used for page-defining questions, major headings, recommendation statements, and occasional member names.
- **Interface sans:** Geist Sans, used for body copy, controls, transcript text, labels, metadata, and tables.
- **Operational mono:** Geist Mono, used only for short WebMCP receipts, timestamps when shown, and technical identifiers.

Do not use the serif for every label. Do not use mono to make the product look technical. Do not add a fourth family.

### Type roles

| Role | Family | Desktop guidance | Use |
|---|---|---|---|
| Display | Newsreader | 60–68 px / 0.96–1.0 | One page-defining statement on selection or readout |
| Page title | Newsreader | 40–48 px / 1.02 | Briefing title and major state titles |
| Decision statement | Newsreader | 26–32 px / 1.12 | Agenda folio and readout recommendation |
| Section heading | Newsreader | 26–30 px / 1.12 | Major readout sections |
| Member name | Newsreader or Geist Sans medium | 15–18 px | Nameplates and closing comments |
| Body | Geist Sans | 16 px / 1.5 | Briefing copy, transcript, readout prose |
| Compact body | Geist Sans | 14 px / 1.4 | Roles, secondary details, invite instructions |
| Label | Geist Sans medium | 12–13 px / 1.25 | Statuses, controls, metadata |
| Operational | Geist Mono | 11–12 px / 1.4 | Tool receipts and bounded system identifiers |

Rules:

- Use sentence case.
- Avoid all-caps eyebrows, tracked overlines, and decorative section numbers.
- Use at most three type sizes in one local composition.
- Keep body text at 15 px or larger in the live meeting.
- Keep paper-mode prose near 58–68 characters per line.
- Use tabular numerals for metrics in the decision brief and readout.
- Do not resize one peer value because its string is longer.
- Rewrite awkward headings before shrinking them.
- Use italics sparingly for a quoted closing thought or a short editorial aside, never for instructions.
- Use bold sparingly. Hierarchy should come from scale, position, and spacing before weight.
- Do not use em dashes in interface copy. Prefer a period, colon, or shorter sentence.

---

## Grid, dimensions, and rhythm

### Global grid

Use a 12-column desktop grid with:

- 32–48 px outer margins depending on viewport;
- 20–24 px gutters;
- 8-column primary fields and 4-column supporting rails as the default relationship;
- 6 columns on tablet-sized layouts;
- 4 columns on narrow layouts.

Every screen should visibly inherit the same grid even when its composition changes.

### Target density

At 1440 × 900:

- The live meeting should fit within one viewport.
- The app header should remain between 52 and 60 px tall.
- The room should receive roughly 62–68% of the usable width.
- The minutes rail should receive roughly 32–38%.
- The table should occupy roughly 68–76% of the room field’s width.
- The minutes rail should be at least 400 px wide.
- The agenda folio should remain readable without covering participant sight lines.

Do not compress the minutes to preserve an oversized table. Do not shrink the table into a decorative thumbnail to make room for chat.

### Spacing scale

Use one shared spacing scale:

`4, 8, 12, 16, 24, 32, 48, 64, 96`

Use spacing relationally:

- Label to value: 4–8 px
- Name to role: 4 px
- Message header to body: 6–8 px
- Message to message: 20–28 px
- Related control cluster: 8–12 px
- Content group to content group: 24–32 px
- Major section turn: 48–64 px
- True chapter break: 80–96 px

Give each gap one owner. Avoid stacked default margins from multiple components.

### Shape

Use three radius roles:

- **2–4 px:** paper sheets, agenda folio, tool receipts, nameplates
- **8 px:** controls, search field, textarea, invite panel
- **50%:** portraits and small status dots only

Do not use large 20–32 px radii. Do not use rounded capsules for ordinary metadata. Do not make every surface soft and friendly; the product should feel precise.

### Shadows and depth

Use depth only where it establishes physical hierarchy:

- One broad, low-opacity shadow may lift the table from the room.
- One restrained shadow may lift the paper minutes rail.
- Nameplates may use a small contact shadow when raised to indicate speaking.
- Controls and cards do not receive ornamental shadows.
- No inner glow, neon shadow, frosted glass, or floating-card stack.

The table should have the deepest shadow in the product. The minutes sheet should have the second deepest. Everything else should rely on alignment, rules, and tone.

---

## Materials and skeuomorphism

The skeuomorphism must communicate function, not imitate expensive objects.

### The table

Use an abstracted elongated racetrack or softened octagonal table viewed from a restrained top-down angle. It should read immediately as a board table without becoming a 3D-rendered office prop.

The table may have:

- a smoked, nearly black surface;
- one thin brass inlay or edge line;
- a shallow bevel;
- a soft neutral pool of light;
- a subtle underside that establishes depth.

The table must not have:

- photorealistic woodgrain;
- marble texture;
- glossy lacquer reflections;
- leather pads;
- ornate brass fittings;
- a boardroom photograph behind it;
- an exaggerated 3D perspective;
- decorative objects that do not carry state.

### The paper

Paper mode is communicated through warm color, typography, rules, and proportion. Do not add paper grain, torn edges, folded corners, stains, binder clips, or faux printing defects.

### The agenda folio

Place a compact paper object at the center of the table containing:

- the decision question, truncated only when necessary;
- a small phase label such as “Opening positions” or “Discussion”;
- an affordance to inspect the full brief.

This is functional. It keeps the decision physically central and offers a stable focus while people speak.

### Nameplates

A nameplate is a thin, low rectangular object attached to or hovering just above the table edge. It contains the person’s name and a small state line. It may lift a few pixels when the person takes the floor.

Do not render ornate engraved plaques. Do not use fake metallic type. The visual metaphor should be legible, not literal.

---

## Portraits and identity

The advisers are the product’s emotional material. Treat their portraits with consistency and respect.

### Portrait treatment

- Use a real, recognizable public portrait supplied by the project or sourced for the static roster.
- Normalize every image to one crop system and one tonal treatment.
- Prefer head-and-shoulders framing with a quiet background.
- Use monochrome or very low-saturation warm grayscale so inconsistent source photography does not fragment the room.
- Increase contrast and local luminance for the active speaker rather than revealing a rainbow of source colors.
- Keep facial features legible at the smallest seat size.
- Do not generate caricatures, avatars, paintings, or “AI versions” of people.
- Do not place company logos in place of faces.

### Fallback identity

When no usable portrait exists, use a typographic monogram in the same portrait frame. Never show a broken image or a generic robot.

### Human chair

The human seat is labeled **You** and may use a simple monogram or neutral silhouette. Do not ask for an avatar in the MVP.

### External personal agent

The joining agent provides its own display name. Use a monogram derived from that name inside the same identity frame, plus the explicit role label **Guest agent**. Do not assume the agent has an image. Do not fabricate an official logo.

The external agent is differentiated by the guest-agent accent, a connector glyph or text label, and its arrival behavior. Color alone is insufficient.

---

## Icons

Use text when text is faster to understand. Use one coherent line-icon family only for established actions such as search, copy, send, close, and link.

Rules:

- No sparkle icons for AI.
- No robot heads, brains, magic wands, stars, or orbiting nodes.
- No icon tiles.
- No mixed line and filled icon styles.
- No oversized decorative icons.
- Statuses such as “Ready,” “Speaking,” and “Wants in” should normally be words or simple marks, not a bespoke icon system.
- The WebMCP guest may use one restrained connector glyph paired with text.

---

## Global shell

The app opens directly into the product. Do not build a marketing landing page, hero section, feature grid, testimonial strip, or onboarding tour.

### Header

Use a quiet, consistent header across states:

- Left: compact product identity, shortened to **Board Meeting** inside the application.
- Center or adjacent field: current state or truncated decision when useful.
- Right: only actions relevant to the current state.

The full project name, **The Best Board Meeting You’ve Ever Had**, may appear as the main title on the first screen. Do not repeat the long name throughout the app.

The live meeting header contains only:

- compact product identity;
- the current decision, truncated to one line;
- **Invite your agent**;
- **End meeting**.

Do not add settings, account controls, model selectors, help menus, theme toggles, or breadcrumbs.

### Progress

Do not use a conventional stepper with circles labeled 1–4. The sequence should be obvious from the screen itself. A quiet text label such as “Choose your board” is enough.

---

## Screen 1: choose your board

### Reader’s job

Help the user answer: **Who do I want in the room?**

### Recommended composition

Use a 4/8 split rather than a centered hero followed by a card grid.

#### Left field: your table

Create a sticky editorial field containing:

- the page-defining title: **Who do you want in the room?**
- one sentence of orientation;
- a miniature top-down table preview labeled **Your board**;
- three to six nameplate positions;
- selected count;
- the primary action **Brief your board**.

The preview begins quiet and incomplete. The minimum three positions should be legible without looking like empty form slots. As advisers are selected, their portrait/nameplate enters the preview. This makes selection feel like assembling a room rather than filling a multi-select.

The primary action remains disabled until three members are selected. At six members, the preview is complete. Do not use a large warning banner for limits.

#### Right field: adviser library

Place search and the portrait catalog in the larger field.

The search field should be prominent but not oversized. Use the placeholder:

> Find a founder, investor, or operator

Present advisers as repeated editorial portrait tiles, not elevated dashboard cards. Each tile contains:

- portrait;
- full name;
- one concise role or expertise line;
- selected state.

The entire tile is selectable. Do not add an “Add” button to every tile.

### Adviser tile behavior

Default:

- portrait in consistent monochrome treatment;
- name in strong type;
- role in secondary text;
- no border unless needed to establish grid rhythm.

Hover or focus:

- slightly increase portrait contrast;
- reveal a quiet rule or inset boundary;
- never scale, tilt, glow, or bounce.

Selected:

- use the human-action accent as a thin inset line or corner mark;
- add a textual selected state for accessibility;
- animate the adviser into the table preview;
- preserve the portrait and name, not just a checkmark.

### Density

Show enough advisers in the first viewport to communicate a real library. Do not make each tile so large that only two or three people are visible. Do not shrink names or roles to force an arbitrary four-column grid.

### Preferred copy

Title:

> Who do you want in the room?

Orientation:

> Choose three to six people whose judgment you want on the decision.

Selected count:

> Your board · 3 of 6

Limit feedback:

> Your table is full. Remove someone to choose another adviser.

### Do not

- center the title above a generic card grid;
- use colorful chips for selected people;
- add filters, categories, sort menus, or recommendation logic for the MVP;
- hide names until hover;
- turn the preview into a 3D animation;
- show model or agent framework details.

---

## Screen 2: brief your board

### Reader’s job

Help the user answer: **What does my board need to know?**

### Recommended composition

Retain a 4/8 split to preserve continuity.

#### Left field: the assembled board

Show the selected board as a compact table preview or vertical nameplate roster. This is a reminder of who will hear the brief, not a second selection interface.

Allow a quiet **Change board** action only if the functional flow supports returning without losing input. Do not make every member removable from this screen unless already required.

#### Right field: the decision sheet

The decision input is the dominant object. Treat the whole field as an open working sheet rather than putting a textarea inside a card.

Use:

- title: **What decision are you trying to make?**
- one concise instruction;
- a large, comfortable writing area;
- the example action;
- one primary action: **Start board meeting**.

The textarea should feel like a place to think. Use generous type and line height. Its boundary can be one quiet rule or paper inset, not a thick rounded container.

Place the **Use example decision** action near the instruction or input header. It should read like a helpful editorial shortcut, not a promotional card.

### Preferred copy

Instruction:

> Give them the context you would give a real board: the goal, the numbers, the constraints, and what feels difficult.

Input placeholder:

> Describe the decision, what has led you here, and what the board should challenge.

Example action:

> Use the pricing decision

Primary action:

> Start board meeting

### Transition into the room

When the meeting starts:

- preserve the selected identities;
- move from warm paper to the dark room in 240–360 ms;
- let the miniature table expand or visually resolve into the live table only when this can be implemented reliably;
- otherwise use a clean crossfade with stable portrait positions.

Do not use a cinematic intro sequence, opening doors, sound, or a loading splash.

---

## Screen 3: the live board meeting

### Reader’s job

Help the user answer: **Who is speaking, what is the board learning, and where should I intervene?**

### Page composition

Use a fixed-height room-and-minutes split beneath the header.

#### Room field

The room is the dominant field. It contains:

- the table;
- selected adviser seats;
- the human chair;
- the agenda folio;
- one reserved location where the external agent can join;
- participant state and subtle reaction cues.

The room is not enclosed in a rounded card. It is the page background for this state.

#### Minutes rail

The minutes rail is a warm paper sheet containing:

- a compact header such as **Minutes** and current phase;
- the shared transcript;
- system events;
- the composer fixed at the bottom.

The rail may have a restrained small radius and shadow. It should read as a continuous sheet, not a chat panel floating in a dashboard.

### Table geometry

Use fixed, art-directed seating layouts for three, four, five, and six advisers rather than evenly distributing nodes with an algorithm.

For the three-person demo board:

- place one adviser at the far end;
- place one on the left side;
- place one on the right side;
- place the human chair at the near end;
- reserve the near-right or far-right threshold for the guest agent.

The arrangement should feel like a conversation, not a symmetrical diagram.

For larger boards:

- preserve the user at the near end;
- distribute advisers along the far end and sides;
- keep every portrait and name legible;
- avoid overlapping the agenda folio;
- do not show distracting empty chairs.

### The human chair

The user’s seat is visually privileged through position, the human-action accent, and the label **You**. Do not make it much larger than other seats. Authority should come from placement and controls, not scale dominance.

### The agenda folio

The agenda folio sits at the table center. It should show:

- a shortened form of the decision;
- current phase;
- a subtle affordance to inspect the complete brief.

During the demo, the question about eliminating the free tier should remain recognizable at a glance.

### Participant seat states

Every seat uses the same geometry and identity contract. State changes should alter a small number of properties consistently.

#### Idle

- portrait at normal contrast;
- nameplate at rest;
- no decorative animation.

#### Considering privately

- status line reads **Considering privately**;
- portrait softens slightly;
- a restrained progress sweep, small moving rule, or static state mark may appear;
- do not use three typing dots or a pulsing avatar.

#### Ready

- status reads **Ready**;
- a small brass or neutral tick appears;
- the seat returns to full clarity.

#### Speaking

- nameplate lifts 3–5 px;
- portrait gains local luminance and contrast;
- one restrained human-action or room-ink edge appears;
- the corresponding minutes entry becomes current;
- no halo, glow, waveform, bouncing ring, or constant pulse.

#### Wants to respond

- a small tab, bracket, or state line appears at the nameplate;
- copy may read **Wants in** or **Has a response**;
- the seat moves forward no more than 2–3 px;
- this state disappears when the member speaks or the moment passes.

#### Reacting

Use a concise textual reaction near the nameplate, such as:

- **Agrees**
- **Pushes back**
- **Reconsidering**

Show it briefly and quietly. Do not use floating emoji, hearts, fire, applause, or confetti.

#### Reconnecting

- reduce local contrast;
- show **Reconnecting…**;
- preserve the seat and identity;
- do not overlay a large error card.

### Independent positions

When the meeting begins, all selected seats enter **Considering privately** together. As each position completes, its seat becomes **Ready**. This should make parallel thinking visible without exposing the private opinion.

Once all required positions are ready, the discussion begins. Do not insert a full-screen “Your board is thinking” interstitial.

### The minutes rail

Treat the transcript as live board minutes.

Each participant contribution contains:

- portrait or monogram, 28–36 px;
- full speaker name;
- optional direct-recipient line such as **to Lulu**;
- body text;
- optional quiet reaction or revised-position note.

Entries are separated by whitespace and, when helpful, a short rule. They do not sit inside speech bubbles.

User contributions use the same structure with the label **You** and a narrow human-accent mark. External-agent contributions use the guest-agent accent and the label **Guest agent**.

System events are compact, full-width rows. Examples:

- Daniel, DHH, and Lulu are ready.
- Codex reviewed the brief and current discussion.
- Codex joined via WebMCP.
- Codex requested a synthesis.

Set system events in compact sans or restrained mono. Do not expose raw tool names, JSON, request IDs, or model telemetry.

### Streaming

- Stream only one public message at a time.
- Let text appear naturally; do not add a blinking simulated typing cursor.
- Keep the active speaker state stable while text streams.
- Auto-scroll only when the user is already near the bottom.
- If the user scrolls upward, do not snap them back. Show a quiet **Jump to latest** action.
- Announce the completed message once to assistive technology rather than reading every token.

### Composer

The composer remains attached to the bottom of the minutes sheet.

It contains:

- a one- or two-line text field;
- mention suggestions when the user types `@`;
- one send action;
- no formatting toolbar, attachments, voice button, emoji picker, or slash-command menu.

Preferred placeholder:

> Add context or call on someone with @

Clicking a seat may insert that person’s @mention. The composer should not look like a consumer chat bubble.

### Meeting controls

**Invite your agent** is a quiet secondary control until used. **End meeting** is always available but should not visually dominate the ongoing conversation. It may use a restrained danger treatment on hover or focus rather than a persistent bright-red fill.

Do not add a confirmation modal for ending the meeting.

---

## The WebMCP invitation and guest arrival

This is the most important designed state change in the demo after entering the room. It receives roughly thirty seconds of attention and must make the interoperability story obvious without stealing the product’s identity.

### Invitation panel

Clicking **Invite your agent** opens a compact **guest pass** panel. Prefer a right-side sheet or anchored panel that preserves the room and at least part of the minutes.

The panel contains:

- heading: **Invite your agent**;
- one sentence explaining that the current page exposes meeting tools;
- the generated invitation prompt;
- one clear **Copy invitation** action;
- a quiet waiting state.

Preferred instruction:

> Give this invitation to a compatible personal agent while this meeting remains open.

Do not style the invitation as source code. Use normal readable text. Use mono only for a short “WebMCP” label or bounded operational detail.

Do not show a QR code, access token, participant permissions matrix, share settings, or production-grade meeting-link controls.

### Waiting state

After copying, the panel may display:

> Waiting for your agent…

At this moment, reveal the guest threshold in the room: a faint seat position, nameplate rail, or open place at the table. Keep it subtle so the room does not look incomplete before invitation.

### Inspection receipt

When the external agent calls the inspection tool, show a quiet system event:

> Codex reviewed the brief and current discussion.

If the display name is not yet known at inspection time, use:

> Your agent reviewed the brief and current discussion.

Do not create a participant seat until the join action succeeds.

### Join choreography

When the join action succeeds, use a 700–1000 ms sequence:

1. The guest threshold becomes fully visible.
2. A thin guest-accent line travels from the outer edge of the room toward the seat or the seat slides 20–32 px into place.
3. The portrait frame resolves into the joining agent’s monogram.
4. The nameplate reveals the agent’s self-supplied display name.
5. The role line reads **Guest agent · WebMCP**.
6. A system event confirms the join.
7. The invite panel dismisses or compacts so the conversation regains space.

Use one continuous ease-out. No bounce, spin, confetti, portal, particle field, door animation, or sci-fi scan.

Under reduced motion, reveal the seat instantly and preserve the system event.

### Guest state sequence

After joining, the guest seat may show one concise state at a time:

- **Reviewing the room**
- **Sharing context**
- **Asking Daniel**
- **Requesting a synthesis**
- **Waiting for the readout**

These states help a viewer understand the sequence without reading developer logs. They should update the same state line, not accumulate into a dashboard.

### Guest contributions

A contributed context message appears in the minutes as a normal participant entry with:

- guest monogram;
- self-supplied display name;
- role label **Guest agent**;
- a narrow guest-accent rule;
- the contribution text.

A direct question uses the recipient line:

> to Daniel Ek

The addressed board member’s seat then receives next-speaker priority and answers in the same room.

### Synthesis request

When the agent requests synthesis, show:

- a system event noting the request;
- a concise secretary contribution titled **Where the board stands**;
- three short parts: agreement, disagreement, unresolved question.

This is an interim meeting artifact, not the final readout. Keep it visually distinct from a participant opinion but integrated into the minutes.

### Retrieval receipt

After the human ends the meeting and the external agent retrieves the readout, show a small guest-accent confirmation near the readout controls:

> Retrieved by Codex

Pair the text with a check or connector mark. Do not open a technical result panel.

---

## Screen 4: the executive readout

### Reader’s job

Help the user answer: **What should I do, why, and what remains unresolved?**

### Transition

The minutes sheet should conceptually become the readout.

Preferred transition:

- room contrast falls back;
- the minutes sheet expands across the canvas in 320–480 ms;
- the table and seats recede;
- participant identities persist in a compact roster;
- the readout title and recommendation resolve first.

A simpler crossfade is acceptable when shared-element motion threatens reliability. Do not delay content behind a long reveal.

### Page composition

Use a warm paper canvas with a maximum reading field around 1120–1200 px. Do not place the entire readout inside one rounded card.

#### Masthead

Show:

- **Board readout**;
- the decision under discussion;
- compact participant roster;
- **Copy readout**;
- guest retrieval confirmation when it occurs.

#### Opening recommendation

The first viewport is the board’s answer, not a summary of the meeting process.

Use a 7/5 or 8/4 composition:

- Larger field: the dominant recommendation or explicit statement that the board remains divided.
- Smaller field: the decisive basis, largest tradeoff, or unresolved question.

Do not lead with six equal summary cards.

Examples of the right form:

> Keep the free tier for now, but narrow it around the referral behavior that creates enterprise demand.

Or:

> The board remains divided. The disagreement turns on whether the free tier is a growth channel or an unfunded support product.

The recommendation must be large enough to become the memory of the page, but not styled like marketing copy.

### Options considered

Use aligned rows or a full-width comparison table with columns such as:

- Option
- Case for it
- Cost or risk
- What would need to be true

Do not use one card per option. Keep text alignment consistent and let the options share one visual basis.

### Key tradeoffs

Present true tensions as paired statements or aligned rows. Examples:

- Conversion efficiency versus product-led discovery
- Support burden versus enterprise referral value
- Narrative simplicity versus user trust

Do not render a decorative 2×2 matrix unless the underlying content truly maps to two axes.

### Assumptions and open questions

These may sit side by side when the content is balanced. Each must have a distinct role:

- **Important assumptions:** beliefs the recommendation depends on.
- **Open questions:** facts the board still needs.

Do not merge them into generic “Considerations.”

### Recommended next actions

Use a numbered sequence, not check-box cards. Make the first action visually strongest. Do not invent owners or deadlines if they were not discussed.

### Closing comments

Show every adviser’s closing comment with:

- portrait;
- full name;
- one concise quote or position.

Three members may form one three-column field when comments are similar in length. Four to six should use a two-column editorial rhythm or full-width sequence. Do not force six long quotes into tiny equal cards.

The external agent does not require a closing-comment block unless it supplied one. Its material contributions should already appear in the recommendation and evidence.

### Ending

End the readout with the concrete next action or unresolved decision point. Do not let the page stop abruptly after closing quotes.

Do not add export to PDF, share links, saved history, editing, ratings, or another call to start a subscription.

---

## Core visual primitives

Implementation agents may name components according to repository conventions, but the following visual contracts must remain stable.

### Adviser portrait tile

Purpose: browse and select a board member.

Contains:

- consistent portrait;
- full name;
- one-line role;
- selected state.

Does not contain:

- biography paragraph;
- tags or pills;
- rating;
- model name;
- separate “Add” button;
- decorative quote.

### Board preview

Purpose: show the room being assembled before the meeting.

Contains:

- miniature table geometry;
- selected nameplates;
- count and minimum state;
- one primary action.

It is not an interactive 3D scene.

### Participant seat

Purpose: show identity, presence, and current state.

Contains:

- portrait or monogram;
- full name;
- nameplate;
- one state line;
- optional transient reaction.

It must support all states without changing its overall footprint.

### Agenda folio

Purpose: keep the decision central.

Contains:

- short decision;
- phase;
- inspect affordance.

It never becomes a generic status card or tool log.

### Minutes entry

Purpose: preserve a readable public contribution.

Contains:

- identity;
- optional recipient;
- message;
- optional position-change note.

No bubble, tail, reaction bar, timestamp by default, or action menu.

### System event

Purpose: record a state transition.

Contains one sentence and, at most, one small icon or operational label.

### Guest pass

Purpose: let the user invite a personal agent.

Contains instruction, generated prompt, copy action, and waiting state. It is the only panel allowed to temporarily overlay the room.

### Readout section

Purpose: answer one decision question. A section should not be wrapped in a card unless the boundary communicates a true interactive or document distinction.

---

## Controls and states

### Buttons

Use three button roles:

- **Primary:** one decisive action per state, solid human-action color on paper or high-contrast room treatment.
- **Secondary:** quiet bordered or text control for invitation, example loading, and copy.
- **Danger:** quiet until hover/focus; used for ending the meeting.

Buttons should be 40–44 px tall with 8 px radius. Avoid rounded-full capsules.

### Inputs

- Search: one-line, quiet boundary, visible search affordance.
- Decision brief: large multi-line writing field, generous type, no inset dashboard styling.
- Composer: one- to two-line field integrated with the minutes sheet.

All inputs require visible labels or accessible names, visible focus, and clear disabled states.

### Focus

Use a 2 px focus ring based on the guest-agent blue in paper mode and its lighter variant in room mode. Do not remove outlines. Focus must remain visible over portraits, table surfaces, and paper.

### Disabled states

Disabled primary actions remain legible and explain their requirement nearby. Do not use tooltips as the only explanation.

---

## Motion and timing

Default to stillness. Motion must explain continuity, social state, or action confirmation.

### Timing roles

| Motion | Duration | Guidance |
|---|---:|---|
| Hover/focus response | 100–160 ms | Immediate, no delay |
| Selection and state change | 160–240 ms | Small displacement or tone shift |
| Screen transition | 240–360 ms | Calm ease-out |
| Speaker lift | 180–240 ms | No bounce |
| Guest join | 700–1000 ms | One coordinated sequence |
| Minutes-to-readout | 320–480 ms | Content available immediately |

Use a smooth, non-spring ease such as a strong ease-out. Avoid elastic, overshoot, bounce, and repeated pulsing.

### Allowed motion

- selected adviser entering board preview;
- room crossfade or shared table expansion;
- nameplate lifting when speaking;
- brief transient reaction label;
- guest seat entering;
- minutes sheet expanding into readout;
- copy confirmation.

### Rejected motion

- parallax;
- cursor-following effects;
- auto-scrolling marquees;
- floating particles;
- looping ambient avatar movement;
- simulated breathing;
- rotating gradients;
- scroll-reveal on every section;
- typing dots on every seat;
- confetti;
- sound.

Respect `prefers-reduced-motion`. Every state must remain complete and understandable with transitions removed.

---

## Copywriting

The interface voice is calm, direct, and human. It should sound like an excellent chief of staff, not a motivational coach, a management consultant, or an AI product marketer.

### Use

- concrete nouns;
- active verbs;
- short sentences;
- real board language only when it clarifies the action;
- candid statements of disagreement;
- specific state labels.

### Avoid

- “Unlock insights”
- “Leverage AI”
- “Supercharge your decisions”
- “Meet your dream team”
- “Wisdom at your fingertips”
- “AI-powered” in primary product copy
- “Strategic synergies”
- “Consensus achieved” unless the board actually agrees
- repeated reminders that members are AI
- legalistic disclaimers in the demo UI

### Preferred action language

- Choose your board
- Brief your board
- Start board meeting
- Invite your agent
- Copy invitation
- Add context
- Ask Daniel
- End meeting
- Copy readout

### System language

Use factual past or present tense:

- Lulu is ready.
- DHH wants to respond.
- Codex joined via WebMCP.
- The board remains divided.
- The readout is ready.

Do not anthropomorphize system mechanics with theatrical narration.

---

## Accessibility

The spatial boardroom must remain fully understandable as a linear interface.

### Semantics

- Use one descriptive `h1` per state.
- Provide landmarks for header, main room, minutes, and readout.
- Represent participant seats as named interactive elements only when they are actionable.
- Expose a linear participant list to assistive technology even when the visual arrangement is spatial.
- Use `role="log"` or equivalent for the minutes with polite announcements.
- Announce completed streamed contributions once, not token by token.
- Preserve logical DOM order independent of visual seat positioning.

### Identity and state

- Every portrait has the person’s name as accessible text.
- Every seat state is represented in text.
- Active speaker and direct recipient are announced.
- The external participant is labeled **Guest agent**, not identified by blue alone.
- Reactions have text alternatives.

### Interaction

- All actions work by keyboard.
- Mention suggestions are navigable and dismissible.
- Clicking a seat to mention someone has an equivalent keyboard path.
- New messages do not steal focus.
- Auto-scroll pauses when the user has moved away from the latest message.
- Pointer targets are at least 44 × 44 px where practical.

### Contrast

- Meet WCAG AA for text and controls.
- Do not use brass for essential text on paper.
- Do not use muted text below acceptable contrast to create atmosphere.
- Focus rings remain visible in both paper and room modes.

---

## Responsive behavior

The MVP is desktop-first, but it must fail gracefully.

### 1280 px and wider

- Preserve room + minutes side by side.
- Keep participant names complete.
- Keep the agenda folio readable.
- Keep the live state within one viewport.

### 1024–1279 px

- Use a 7/5 or similarly rebalanced split.
- Reduce room padding before shrinking portraits or text.
- Compact long role labels, not names.
- Allow the agenda folio to show a shorter decision line with full brief on activation.

### Below 1024 px

- Stack the room above the minutes.
- Keep the board stage complete and horizontally contained.
- Let the minutes become a full-width document below.
- Keep meeting controls in a sticky top or bottom bar.
- Do not attempt to preserve the side-by-side composition at the cost of unreadable text.

### Narrow mobile

Full mobile optimization is out of scope. The product must still avoid horizontal page overflow, unreachable controls, and character-level wrapping. Do not spend MVP time inventing a separate mobile boardroom.

---

## Error and degraded states

Errors should remain local to the participant or action that failed.

### Adviser retry

Keep the seat visible. Change the state line to **Reconnecting…**. Do not dim the entire room or display a modal.

### Failed public turn

End the partial stream cleanly. Show a compact retry action in the corresponding minutes entry or let orchestration move on. Never leave a permanent typing state.

### WebMCP unsupported

Inside the guest pass, explain plainly that the current browser does not expose site tools. The human meeting remains unchanged. Do not show a page-level warning banner.

### Readout fallback

If final synthesis fails, preserve the paper readout state and show the best available structured fallback. Do not return to the meeting or show a blank error screen.

### Empty search

Use one line:

> No board members match that search.

Do not add illustrations or suggestions unless they directly help.

---

## Reject generated-design reflexes

Do not ship any of the following:

- A generic centered hero followed by a grid of rounded cards.
- A conventional dashboard shell with left navigation.
- A video-call grid of equal participant tiles.
- A Slack or iMessage clone with colored speech bubbles.
- Purple, blue, or rainbow AI gradients.
- Glassmorphism, backdrop blur, neon glows, or floating orbs.
- Sparkles, magic wands, robot heads, brains, or constellation icons.
- A photorealistic boardroom, office background, wood texture, marble, leather, or fake gold.
- Cartoon chairs, 3D avatars, or metaverse aesthetics.
- Celebrity caricatures or generated portraits.
- One arbitrary color per adviser.
- Repeated pills for names, roles, statuses, and metadata.
- Cards nested inside cards.
- A rounded rectangle around every message, option, metric, and section.
- Oversized empty-space theater that delays the user’s task.
- Tiny gray type used to fit more content.
- All-caps eyebrows and overlines.
- Decorative section numbering.
- Huge icons above headings.
- A wizard stepper.
- Full-screen loading spinners between product states.
- Looping “thinking” animations on every participant.
- Simulated typing cursors or three-dot chat indicators.
- Emoji reactions.
- Confidence meters, vote bars, or fake consensus scores.
- Tool-call JSON or developer console styling in the WebMCP demo.
- A bright “End meeting” button competing with the conversation.
- A readout composed of six equal summary cards.
- Duplicated recommendation, summary, conclusion, and next-step sections saying the same thing.
- A marketing call to action after the readout.

Do not compensate for avoiding these defaults with a sterile black-and-white wireframe. The product needs one strong table, an editorial paper system, consistent portraits, decisive typography, and stateful motion. Restraint is selection, not absence.

---

## Fixed design evaluation scenarios

Use the following scenarios for every meaningful visual iteration. Keep fixture content, viewport, and state stable so changes can be compared.

### Scenario 1: empty board selection

Viewport: 1440 × 900

Expected:

- title and task understood within three seconds;
- miniature table preview is visible but not gimmicky;
- adviser library feels substantial;
- no giant marketing hero;
- primary action clearly requires at least three selections.

### Scenario 2: three-member board selected

Board:

- Daniel Ek
- David Heinemeier Hansson
- Lulu Cheng Meservey

Expected:

- selected identities are unmistakable;
- preview feels like an assembled board;
- the next action is obvious;
- no colored chip collection.

### Scenario 3: decision briefing populated

Use the full free-tier decision from the product specification.

Expected:

- the decision sheet dominates;
- metrics and links remain readable;
- selected board stays present but quiet;
- the screen does not resemble a form wizard.

### Scenario 4: opening positions

All three members are considering privately; one becomes ready before the others.

Expected:

- parallel thinking is obvious;
- private content is not exposed;
- no full-screen loading state;
- table and names remain stable.

### Scenario 5: active discussion

State:

- DHH is speaking;
- Lulu wants to respond;
- Daniel has reacted;
- six minutes entries are present;
- the composer contains `@Lulu`.

Expected:

- the current speaker is obvious from both room and minutes;
- social dynamics are visible without animation noise;
- the screen reads as a meeting, not chat;
- the decision remains visible.

### Scenario 6: Codex joining through WebMCP

State sequence:

- invite panel open;
- invitation copied;
- inspection receipt;
- guest seat joining;
- Codex contribution;
- question to Daniel;
- synthesis request.

Expected:

- each step is visible without developer tools;
- the guest arrival is the strongest state change in the meeting;
- the boardroom remains the main story;
- guest accent is present but controlled;
- no technical console dominates the UI.

### Scenario 7: executive readout

Use a result in which the board recommends a staged approach but preserves meaningful disagreement.

Expected:

- recommendation is the first read;
- division is honest and legible;
- options and tradeoffs share a clear visual basis;
- next actions are scannable;
- closing comments feel like people, not equal cards;
- Codex retrieval confirmation is subtle but visible.

### Scenario 8: six-member stress test

Use six advisers with mixed name lengths and a long decision question at 1280 × 800.

Expected:

- no overlapping seats;
- no truncated full names unless an intentional two-line treatment is used;
- table, agenda, minutes, and controls remain usable;
- no page-level horizontal overflow;
- the room still feels composed rather than crowded.

---

## Review rubric

Score each rendered scenario against these questions. A serious failure in any of the first six should block shipping.

### 1. Task clarity

- Can a new viewer state what the user is doing within three seconds?
- Is the primary action obvious without reading every label?
- Does the interface reveal only controls needed now?

### 2. Product specificity

- Could this design be transplanted unchanged to a generic AI group chat?
- Does the table organize the experience rather than decorate it?
- Does the decision remain the room’s center of gravity?

### 3. Social presence

- Is every participant’s identity legible?
- Is the current speaker unmistakable?
- Do reactions and interruptions feel social rather than gamified?
- Does the user clearly occupy the chair role?

### 4. Hierarchy

- Is there one dominant object in the viewport?
- Are supporting objects quieter without becoming unreadable?
- Does open space amplify the focal object?
- Are there accidental empty rectangles or equal-weight sections?

### 5. Typography

- Are serif and sans roles disciplined?
- Is body copy comfortable at the target viewport?
- Are long names and questions handled without arbitrary shrinking?
- Are baselines, labels, and peer values aligned?

### 6. WebMCP comprehension

- Can a viewer follow inspection, join, contribution, question, synthesis, and retrieval?
- Is the guest seat visibly part of the same meeting?
- Does the experience avoid looking like a tool debugger?

### 7. Restraint

- Can a card, border, shadow, icon, label, color, or animation be removed without losing meaning?
- Is any decorative effect compensating for weak hierarchy?
- Is the room atmospheric without becoming theatrical?

### 8. Outcome quality

- Does the readout feel worth copying and referring back to?
- Is the recommendation more prominent than the process?
- Is disagreement preserved rather than visually buried?

### 9. Accessibility

- Does every state work without color or motion?
- Is keyboard order logical?
- Are focus, contrast, labels, and live announcements sound?

### 10. Demo performance

- Does any animation or layout transition slow the two-minute path?
- Does text reflow cause visible jumps?
- Does the room remain stable while agents stream?

---

## Deterministic design checks

Where practical, add mechanical checks for recurring failures:

- No page-level horizontal overflow at 1440, 1280, and 1024 px.
- No page-level vertical scroll in the live meeting at 1440 × 900 and 1280 × 800.
- Minutes rail remains at least 400 px wide in the primary layout.
- Body text in the meeting is at least 15 px.
- All primary controls have visible focus and a minimum 40 px height.
- `rounded-full` or equivalent is used only for portraits, tiny status dots, and truly circular icon buttons.
- No backdrop blur or glass surface.
- No decorative multicolor gradient.
- No speech-bubble tails or per-message rounded cards.
- No more than the two semantic accent families appear in product UI.
- Every selected adviser has a visible full name in the preview and meeting.
- Every participant state has text, not color alone.
- The external guest has an explicit **Guest agent** label.
- The readout contains all required sections from the product specification.
- The guest retrieval confirmation is visible after the corresponding WebMCP action.

Mechanical checks catch known failures. They do not establish taste. A human or the General agent must still review full screenshots.

---

## Parallel implementation rules

The coding-agent fleet should parallelize screen work without forking the visual language.

### General orchestrator

The General agent owns:

- final composition decisions;
- shared tokens;
- typography setup;
- global grid and shell;
- common portrait, nameplate, and seat contracts;
- integrated screenshot review;
- approval of any deviation from this file.

Only General should make broad token changes after the first integrated visual pass.

### Onboarding design agent

Owns:

- board selection;
- adviser tiles;
- board preview;
- briefing sheet;
- paper-mode transitions.

Must reuse the shared nameplate and portrait primitives used in the room.

### Boardroom design agent

Owns:

- table geometry;
- fixed seat layouts for three to six advisers;
- agenda folio;
- participant states;
- room-mode composition.

Must not invent transcript styling or WebMCP-specific colors.

### Minutes and readout design agent

Owns:

- minutes sheet;
- transcript entries;
- composer;
- system events;
- interim synthesis;
- executive readout.

Must maintain the same editorial paper language across live and final states.

### WebMCP experience agent

Owns:

- guest pass;
- waiting threshold;
- join choreography;
- guest seat states;
- visible tool receipts;
- retrieval confirmation.

Must treat guest behavior as part of the same room, not a separate agent dashboard.

### Integration rule

Every workstream must build against shared mock fixtures for:

- three-person board;
- six-person board;
- all seat states;
- long and short messages;
- guest join sequence;
- consensus and divided readouts.

Subagents return full-screen screenshots, not isolated components. General reviews the composite at fixed viewports before merge.

Do not add a new component library, icon family, color palette, font, radius scale, or motion system inside a workstream.

---

## Final handoff checklist

Before declaring the design implementation complete:

- The first screen begins with the product task, not marketing.
- Selection feels like assembling a room.
- The decision brief feels like a working sheet, not a form card.
- Entering the meeting creates a meaningful shift from paper to room.
- The table is immediately recognizable and visually dominant.
- The decision remains visible at the center of the table.
- Every adviser’s full name and portrait remain legible.
- Independent thinking, ready, speaking, reacting, wants-in, and reconnecting states are distinct.
- The minutes look like minutes, not chat bubbles.
- The human’s chair role is obvious.
- The Invite your agent control is present but not dominant before use.
- The guest invitation is easy to copy.
- The guest arrival is unmistakable, tasteful, and under one second.
- The external agent’s contribution, question, synthesis request, and retrieval each leave visible evidence.
- The final readout leads with a recommendation or honest division.
- Tradeoffs, assumptions, open questions, next actions, and closing comments are easy to scan.
- The product remains coherent with three and six advisers.
- No generic AI visual reflexes survived the review.
- Reduced-motion and keyboard use preserve the complete flow.
- The exact two-minute demo succeeds repeatedly without visual recovery steps.

The target is not “a beautiful AI app.” The target is a room with judgment in it.
