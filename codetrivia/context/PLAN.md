# codetrivia
> Based on: Code Trivia (original)

## Game Design

**What we're building:** A programming-knowledge trivia game with a campaign mode. Players progress through 5 increasingly difficult levels, each requiring a higher pass rate to advance. Questions cover 8 tech categories with 2 question formats.

**Rules:**
- One question shown at a time; no time limit per question
- Player selects an answer, then moves to the next question
- Correct answer: score a point, move to next question
- Wrong answer: mark wrong, move to next question
- Time elapsed per level and total campaign time are tracked for the leaderboard
- After all questions in a level: check if pass threshold met
- Meet threshold: advance to next level
- Miss threshold: campaign over, show final level reached
- Complete all 5 levels: win screen

**Players:** 1 (solo campaign)

**Modes / variants:** Campaign only (no free play mode)

**Win / draw conditions:**
- Win: complete all 5 levels (pass all thresholds)
- Lose: fail to meet a level's pass threshold
- No draw

**Question formats:**
- Multiple choice: 4 options (A/B/C/D), one correct
- True/False: 2 options

**Categories (8 total):**
1. JavaScript
2. Python
3. General CS
4. Web (HTML/CSS/HTTP)
5. Git / CLI
6. Algorithms & Data Structures
7. Bash / Shell
8. Databases (SQL/NoSQL concepts)

**Campaign structure:**

| Level | Questions | Pass threshold | Difficulty pool |
|-------|-----------|---------------|-----------------|
| 1 | 5 | 3/5 (60%) | easy only |
| 2 | 6 | 4/6 (67%) | easy + medium |
| 3 | 8 | 6/8 (75%) | medium only |
| 4 | 8 | 7/8 (87%) | medium + hard |
| 5 | 10 | 9/10 (90%) | hard only |

**UI flow:**
1. Home screen: title, "Start Campaign" button, best score + best time display, theme toggle, donate button
2. Level intro screen: "Level N — <level name>", question count, pass threshold ("Need X of Y"), "Begin" button
3. Play screen: category badge, question text, answer options (MC or TF), level/question progress ("Q 3 of 8"), score so far, elapsed time
4. Answer feedback: brief flash (correct/wrong + correct answer shown) before auto-advancing ~1.2s
5. Level result screen: score summary (X/Y correct), pass/fail message, level time, "Next Level" or "Game Over" button
6. Win screen: "Campaign Complete!", total score, total time, best score, best time, "Play Again" button
7. Game over screen: level reached, final score, best score, best time, "Try Again" button

**Edge cases:**
- Question bank exhausted for a difficulty pool mid-level: fall back to adjacent difficulty rather than repeating
- Same question drawn twice in one campaign session: prevented by tracking `usedIds` set per session
- User refreshes mid-game: resume from saved state in localStorage (timer resumes from saved elapsed)
- Category has fewer questions than needed for a level: pull extra from other categories to fill, flagged in console during dev

---

## Data Model

**Board / grid:** N/A — linear question flow

**Question shape:**
```ts
interface Question {
  id: string;               // unique slug e.g. "js-typeof-null"
  category: Category;       // one of the 8 category values
  difficulty: 'easy' | 'medium' | 'hard';
  format: 'multiple-choice' | 'true-false';
  prompt: string;           // question text
  options: string[];        // MC: 4 items index 0–3; TF: ["True", "False"]
  answer: string;           // must match one value in options[]
  explanation: string;      // shown after answering
}

type Category = 'javascript' | 'python' | 'general-cs' | 'web' | 'git-cli' | 'algorithms' | 'bash' | 'databases';
```

**Game state shape:**
```ts
interface GameState {
  phase: 'home' | 'level-intro' | 'playing' | 'level-result' | 'game-over' | 'win';
  currentLevel: number;           // 1–5
  currentQuestionIndex: number;   // 0-based index within level's questions
  levelQuestions: Question[];     // questions selected for this level
  answers: AnswerRecord[];        // one per question answered so far this level
  usedIds: string[];              // all question IDs used this campaign session
  totalScore: number;             // cumulative correct answers across all levels
  levelStartTime: number | null;  // Date.now() when current level began; null if not active
  totalElapsedMs: number;         // sum of completed level times (ms); current level adds on top
}

interface AnswerRecord {
  questionId: string;
  givenAnswer: string;
  correct: boolean;
  timeMs: number;                 // ms taken to answer this question
}
```

**State flags:**
- `phase` drives which screen renders
- `levelStartTime` used to compute level elapsed time; set to `Date.now()` on "Begin"; saved to localStorage on every state change so refresh can resume elapsed
- `totalElapsedMs` accumulates completed level times; final campaign time = `totalElapsedMs + (Date.now() - levelStartTime)`
- `usedIds` persists across levels for the full campaign session, cleared on new game
- `answers` reset each level (level result computed from it before reset)

**Turn structure:** Question shown → player selects answer → feedback flash (1.2s) → next question or level result

**Move validation approach:**
- Both formats: `givenAnswer` must equal one of `options[]`; correct if it equals `answer`
- Answer buttons are disabled during the 1.2s feedback flash to prevent double-submit

**Invalid move handling:**
- Clicking an option locks all options immediately; no re-selection allowed

---

## Help & Strategy Guide

**Objective:** Pass all 5 levels by answering enough questions correctly. Each level raises the bar — level 5 requires 9 out of 10 correct. Answer fast to set a best time record.

**Rules summary:**
- Answer each question by selecting an option
- You need a specific number correct to advance (shown on level intro screen)
- Wrong answers count against you; there is no time pressure per question
- You cannot go back to a previous question

**Key strategies:**
- On Level 4 and 5, track how many you can still afford to miss: at 7/8 threshold with 3 left and 4 correct, you must get all 3
- True/False questions test specific behavior edge cases (e.g. "typeof null === 'object'") — trust exact knowledge, not gut feel
- Category badge tells you the domain before you read the question — use that context shift to recall relevant knowledge
- Speed matters for best time even though there is no per-question timer — don't linger after you know the answer

**Common mistakes:**
- Misreading the pass threshold — 7/8 means you can miss only 1, not 2
- Clicking quickly on True/False without reading the full statement — negations and edge cases are common traps
- Not reading the explanation on wrong answers — level 5 questions often build on concepts introduced in levels 1 and 2
- Assuming the "obvious" answer is correct on hard questions — distractors are designed to look right

**Tips for beginners:**
- Level 1 uses only easy questions — use it to learn the interface rhythm before stakes are high
- Read explanations even when you get a question right — they often reveal a nuance worth knowing for later levels
- Git/CLI and Bash questions frequently test exact flag syntax — common flags like `-r`, `-f`, `-a`, `--force`, `--cached` appear often
- SQL questions test both syntax and behavior — know the difference between `DELETE`, `TRUNCATE`, and `DROP`

---

## Game Logic
- [x] `selectQuestionsForLevel(level, usedIds, allQuestions)` — filter by difficulty pool for level, exclude usedIds, shuffle, take required count; if pool is short, draw from adjacent difficulty to fill
- [x] `checkAnswer(question, givenAnswer)` — returns `boolean`; `givenAnswer === question.answer` (both are exact option strings)
- [x] `computeLevelResult(answers, level)` — returns `{ correct, total, passed, elapsedMs }` where `passed = correct >= LEVEL_CONFIG[level].threshold`
- [x] `buildAnswerRecord(question, givenAnswer, questionStartTime)` — constructs `AnswerRecord` with `timeMs = Date.now() - questionStartTime`
- [x] `advanceCampaign(state, levelElapsedMs)` — adds `levelElapsedMs` to `totalElapsedMs`; if level passed and level < 5: go to next level-intro; if level 5 passed: go to win; if failed: go to game-over
- [x] `LEVEL_CONFIG` constant: array of `{ questionCount, threshold, difficultyPool }` indexed 0–4 (levels 1–5)
- [x] `saveState(state)` / `loadState()` — serialize/deserialize `GameState` to localStorage key `codetrivia-state`
- [x] `saveBest(score, timeMs)` / `loadBest()` — persist `{ score, timeMs }` to `codetrivia-best`; update only if new score > stored score, or same score with lower time
- [x] New game: clear `usedIds`, reset `totalScore`, reset `totalElapsedMs = 0`, set `currentLevel = 1`, set `phase = 'level-intro'`
- [x] Question bank: `src/questions/index.ts` re-exports all questions from per-category files; minimum 20 easy, 20 medium, 15 hard per category (120+ total easy, 120+ medium, 90+ hard = 330+ questions)

---

## Components
- [x] `App` — holds `GameState`, dispatches all state transitions, persists to localStorage on every state change
- [x] `HomeScreen` — title, "Start Campaign" button, best score + best time display, theme toggle, donate button
- [x] `LevelIntro` — shows level number, flavor name, question count, threshold ("Need X of Y"), "Begin" button
- [x] `QuestionCard` — renders question prompt, category badge, answer option buttons (4 for MC, 2 for TF); buttons disabled during feedback flash; elapsed time counter (counts up, updates every second)
- [x] `ElapsedTimer` — counts up from 0 for current level; display only, no timeout; props: `startTime: number`
- [x] `FeedbackFlash` — overlay shown for 1.2s after selecting an answer; shows correct/wrong icon, correct answer text, explanation
- [x] `LevelResult` — score (X/Y correct), pass/fail message, level time, cumulative time, "Next Level" or "Game Over" button
- [x] `GameOver` — level reached, final score, best score, best time, "Try Again" button
- [x] `WinScreen` — "Campaign Complete!", total score, total time, best score, best time, "Play Again" button
- [x] `HelpModal` — "?" button on play screen; explains MC and TF formats, campaign structure, how best time is recorded
- [x] `ConfirmModal` — "Are you sure?" used for "Quit to Home" action during play; props: `message`, `onConfirm`, `onCancel`
- [x] `DonateButton` — consistent across home/win/game-over screens
- [x] `ThemeToggle` — sun/moon icon button; reads/writes theme to localStorage

---

## Styling
- [x] `global.css` — CSS variables for light/dark theme (colors, backgrounds, accents), base resets, font stack (monospace for code snippets in question prompts)
- [x] `App.css` — screen transitions (fade between phases)
- [x] `HomeScreen.css` — centered layout, large title, best score/time display, button sizing
- [x] `LevelIntro.css` — level badge, stat grid (questions / threshold), flavor name treatment
- [x] `QuestionCard.css` — card layout, MC/TF option buttons (hover/selected/correct/wrong states), category badge colors per category, elapsed timer display
- [x] `FeedbackFlash.css` — centered overlay with semi-transparent backdrop, correct/wrong icon, explanation text, fade-in/out animation
- [x] `LevelResult.css` — score breakdown, pass/fail color treatment, time display
- [x] `GameOver.css` — centered layout, level badge, score/time summary
- [x] `WinScreen.css` — celebratory treatment, score/time display, best record callout
- [x] `HelpModal.css` — modal overlay, scrollable content, close button
- [x] `ConfirmModal.css` — small centered dialog, confirm/cancel buttons

---

## Polish
- [x] Category badge has distinct color per category (8 colors from CSS variables)
- [x] MC/TF option buttons: hover highlight, click locks all buttons immediately, correct=green/wrong=red revealed during feedback flash
- [x] Feedback flash animates in (scale + fade) and auto-dismisses after 1.2s
- [x] Level flavor names: Level 1 "Boot Camp", Level 2 "Junior Dev", Level 3 "Mid-Level", Level 4 "Senior Dev", Level 5 "Principal"
- [x] Code snippets in questions rendered in `<code>` tags with monospace font and subtle background
- [x] Score counter in play screen increments with a brief pop animation on correct answer
- [x] Game over and win screens show a phrase based on level reached (e.g. "Made it to Senior Dev!" for level 4)
- [x] Keyboard support: number keys 1–4 for MC options, T/F keys for true/false, Escape to open quit confirm
- [x] ARIA labels on all interactive elements: option buttons (`aria-label="Option A: <text>"`), modals (`role="dialog"` with `aria-modal`), theme toggle (`aria-label="Switch to dark/light mode"`)
- [x] localStorage: `codetrivia-theme`, `codetrivia-best`, `codetrivia-state` (no last-mode key — only one mode)

---

## Testing

**Unit tests — game logic (`src/gameLogic.test.ts`):**
- [x] `checkAnswer` — MC: givenAnswer matching `question.answer` returns true; non-matching option returns false
- [x] `checkAnswer` — TF: "True" correct when `answer` is "True"; "False" correct when `answer` is "False"
- [x] `computeLevelResult` — 3 correct of 5 on level 1 returns `passed: true`; 2 correct returns `passed: false`
- [x] `computeLevelResult` — 9 correct of 10 on level 5 returns `passed: true`; 8 correct returns `passed: false`
- [x] `computeLevelResult` — 7 correct of 8 on level 4 returns `passed: true`; 6 correct returns `passed: false`
- [x] `selectQuestionsForLevel` — returns exactly `questionCount` questions for the level
- [x] `selectQuestionsForLevel` — no returned question ID appears in `usedIds`
- [x] `selectQuestionsForLevel` — when pool has fewer questions than needed, fills to `questionCount` using adjacent difficulty
- [x] `advanceCampaign` — passing level 3 sets `currentLevel = 4` and `phase = 'level-intro'`
- [x] `advanceCampaign` — passing level 5 sets `phase = 'win'`
- [x] `advanceCampaign` — failing any level sets `phase = 'game-over'`
- [x] `saveBest` / `loadBest` — updates when new score is higher; updates when same score but lower time; does not update when score is lower

**Component tests — (`src/App.test.tsx`):**
- [x] Home screen renders "Start Campaign" button
- [x] Clicking "Start Campaign" shows level-intro for level 1
- [x] Level intro shows correct threshold text ("Need 3 of 5")
- [x] Clicking "Begin" shows first question card with elapsed timer at 0
- [x] Clicking a correct MC option shows FeedbackFlash with correct styling
- [x] Clicking a wrong MC option shows FeedbackFlash with wrong styling and reveals correct answer
- [x] After all level questions, LevelResult screen shown with correct score and time
- [x] Failing level 1 shows GameOver screen
- [x] Quit confirm modal appears when clicking quit during play
- [x] Theme toggle persists to localStorage and updates CSS class
