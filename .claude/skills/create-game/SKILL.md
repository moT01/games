---
name: create-game
description: Scaffolds and builds a game from scratch. Only invoked explicitly as /create-game <game-name> — do not trigger from natural language.
---

# create-game

## Purpose

Scaffold, plan, and fully build a new game from scratch.

## Invocation

```
/create-game checkers
/create-game five-dice (yahtzee)
```

The first argument is the game name to use for folders and files. If a name is provided in parentheses, that is the well-known game to base it on if it exists. Otherwise use the game name as the known game.

Do not run this skill unless explicitly invoked with the `/create-game` command.

---

## Step 1 — Parse invocation

- `<game-name>` — folder name and project name
- `<known-game>` — the well-known game to base it on (parentheses value if provided, otherwise same as game name)

Use `<known-game>` for all rules and game knowledge.
Use `<game-name>` for all file and folder naming.

---

## Step 2 — Ask upfront questions

Before touching any files, introduce what you're about to build and ask focused questions. Keep it conversational — only ask what you genuinely need answered.

**Always ask:**
1. Any rules variants? _(name the most common version you'll use as the default so the user knows what to expect)_
2. Any mode overrides? _(state the default modes you're planning based on the game type, ask if they want anything different)_

**Ask only if genuinely unclear:**
- Anything about the game's rules that has common variations you can't resolve yourself
- Computer player requirements if the game type is ambiguous

Format it like:

> "I'm going to build **[known-game]** as **[game-name]**. 
> 
> 1. ...
> 2. ...
> ...
> Any additional features or custom behaviour?
>
> Defaults: [list what you're planning]. Just say go if that works."

Wait for the user's response before doing anything else.

---

## Step 3 — Bootstrap the project

Step 3a - Decide the boilerplate

Use simple (HTML/CSS/JS) when:

Canvas-based games (shooters, platformers, arcade)
Simple single-screen games (minesweeper, 2048)
Anything where the DOM structure is minimal

Use React/Vite when:

Complex state across many components
Games with lots of UI screens and interactions
Anything where TypeScript and component structure genuinely helps

Always choose the simplest option that fits the game. Prefer the simple boilerplate if possible. Don't overcomplicate. For simple games (HTML/CSS/JS), go to step 3a, for complex games (React/Vite), go to step 3b.

### Step 3a — Copy simple boilerplate

1. Run `cp -R boilerplate-simple <game-name>` from the repo root
2. In `<game-name>/index.html`, replace the placeholder title with a capitalized human-friendly version of the game name (e.g. "Five Dice" not "five-dice")

### Step 3b — Copy react boilerplate

1. Run `cp -R boilerplate-react <game-name>` from the repo root
2. In `<game-name>/index.html`, replace the placeholder title with a capitalized human-friendly version of the game name
3. Run `npm install` inside `<game-name>/`.

---

## Step 4 — Plan the game

## Step 4a — Create the plan file

1. Create a `context` directory in <game-name> - so you have `<game-name>/context/`.
2. If using the simple boilerplate, copy `.claude/templates/PLAN_TEMPLATE_SIMPLE.md` to `<game-name>/context/PLAN.md`. If using the react boilerplate, copy `.claude/templates/PLAN_TEMPLATE_REACT.md` to `<game-name>/context/PLAN.md`. In the new file...
3. Replace all `<game-name>` placeholders with the actual game name
4. Replace all `<known-game>` placeholders with the known game name

## Step 4b — Fill out the plan

Read the `<game-name>/context/PLAN.md` to understand the template. The template is a minimum structure, not a ceiling. Add sections, fields, or checklist items whenever the game warrants it.

Read `.claude/UI.md` to understand the visual and CSS standards. The plan's Styling section must include specific checklist items derived from it — not placeholders.

Every plan must include all of the following:

### Home Screen
- Full viewport (100vw × 100vh)
- Game-themed background — elegant and minimal, not overwhelming
- Centered content container: visible border, rounded corners, subtle shadow, min-width 420px
- Top of container: 3 icon buttons (help, theme, donate) — use SVGs from `.claude/icons/`
- Content: game title, then the following where applicable:
  - Mode selector
  - Difficulty selector (Normal / Hard) — if computer opponent with meaningful difficulty
  - Color / side selector — if the player chooses a color or side (e.g. chess, checkers)
- Records display — show saved records relevant to the game (see Local Storage below)
- Buttons: "New Game" always shown; "Resume" shown only if a saved game exists
- Last selected mode, difficulty, and color/side persisted to local storage

### Play Screen
- Centered game container on a game-themed background — same visual language as the home screen; min-width 420px; max-width sized appropriately for the game; responsive
- Container header: 4 icon buttons (close, help, theme, donate) — use SVGs from `.claude/icons/`
- Horizontal rule below the header
- Game area below the rule, centered
- Score/status/timer visible during play (where applicable)
- Exception: canvas or arcade games may use full viewport where maximizing play area matters

### Game Over
- Overlay on the play screen — not a separate screen
- Shows result, best score, and play again / return to menu buttons

### Modals
- Help/Rules modal — accessible from all screens via the help button, content specific to the game; min-width 420px
- Confirmation modal for destructive actions (new game, quit to menu); min-width 420px

### Computer Opponent
_(Include only if the game has a computer player)_
- Offer Normal and Hard difficulty when it makes sense for the game
- Normal = reasonable but beatable; Hard = strongest available strategy
- Selected difficulty persisted to local storage

### Local Storage
- Theme preference
- Last selected mode, difficulty, and color/side
- Game state — enables Resume on reload
- Records — track what makes sense for the game type:
  - Competitive (vs computer): win count per difficulty level
  - Timed / puzzle: best time and best move count
  - Both if applicable

### Accessibility
- Keyboard navigation
- ARIA labels on all interactive elements

### Theming
- Light/dark toggle — use `.light-palette` / `.dark-palette` classes from `global.css`
- Never hardcode colors — use semantic CSS variables from `global.css`

Be sure to include all of the user's decisions from step 2 in the plan as well.

Before writing, think through the non-obvious mechanics of this specific game:
- What surprises first-time implementers?
- What state changes are easy to forget or get wrong?
- What happens at edge transitions — deck exhausted, board full, turn wrap-around?
- Does any piece or card have dual state (e.g. face-up/face-down)?
- Are there cascading effects or resets that don't preserve order?

While writing, be explicit about each thing, while being as concise as you can. Avoid vague statements like "handle moves" or "implement game logic". Instead, break those down into specific function names, state flags, or checklist items that are unique to this game.

Every screen should be accounted for with specific components and responsibilities. For example, instead of "create a header component", specify "create a Header component that renders the theme toggle, donate button, and help button, and accepts props for status text and close button visibility".

For well-known games, use canonical rules and systems — don't invent your own. Name them explicitly. Include tests that verify correct behavior against known examples.

Every non-obvious mechanic must appear somewhere in the plan — Special Rules, Edge Cases, Data Model, or Game Logic. If a mechanic has no test case, add one.

Fill out every section completely — no placeholders, no `...`, no generic content. Only include the AI / Computer Player section if the game has a computer opponent.

Fill in the Help & Strategy Guide with real strategies, actual common mistakes, and beginner tips specific to this game.

Write the completed plan to `<game-name>/context/PLAN.md`.

---

## Step 5 — Self-review

Read the completed plan and check:
- Is it specific enough to code from without any questions?
- Are all user decisions from step 2 included?
- Are all items from `STANDARD_FEATURES.md` included?
- All checklist items specific enough to code from — no vague items like `- [ ] handle moves`?
- Non-obvious mechanics covered with corresponding test cases (if applicable)?
- Any canonical systems named explicitly?

**Critical Fixes:**
- Any `...` placeholders remain
- Any section is blank without a justified N/A
- Are Win / draw conditions are vague or incomplete
- Data model is missing state shape, piece types, or turn structure
- Move validation approach is not specified
- Game Logic items are generic rather than specific function names
- Components are listed without specific responsibilities
- Testing has no specific test cases (if applicable)
- Edge cases section is empty

**Meaningful improvement:**
- Special rules exist but state flags are missing from the data model
- Computer player mentioned but AI strategy is vague
- Testing has a start but obvious cases for this game are missing
- Edge cases feel thin given the complexity of the game
- Help & Strategy Guide content feels generic rather than game-specific

Fix any gaps using the rules from step 4, then write the final plan to `<game-name>/context/PLAN.md`.

---

## Step 6 - Get user approval

Show the user:
> "The <game-name> plan is ready for your review. Respond with 'plan approved' to start coding, or provide feedback for changes."

Wait for explicit approval before proceeding. If the user requests changes, update the plan and ask again.

Only proceed to the coding loop if the user replies with "plan approved". Any other response is treated as a change request — update the plan and ask again.

---

## Step 7 — Launch coder

```
Task: "Read and follow `.claude/skills/coder/SKILL.md`.
Game name: <game-name>
Known game: <known-game>"
```

---

## Step 8 — Done

Tell the user:
> "<game-name> complete."

If the coding loop hit the iteration cap, note which checklist items remain unchecked.
