# Five Dice — Update Checklist

## 1. UI Scaling
- [x] Increase dice size so they fill more of the left panel
- [x] Widen the scorecard to better use available space
- [x] Review DiceArea layout — ensure it fills the left column naturally
- [x] Check overall `.app` layout fills the window without feeling sparse

## 2. Rules Modal
- [x] Add a "Rules" button (top of DiceArea or app header)
- [x] Create a `RulesModal` component with overlay
- [x] Write rules content covering:
  - [x] Upper section (ones–sixes: sum of that face value)
  - [x] Upper bonus (score ≥ 63 → +35)
  - [x] 3 of a Kind / 4 of a Kind (sum of all dice)
  - [x] Full House (exactly 25)
  - [x] Small Straight (exactly 30)
  - [x] Large Straight (exactly 40)
  - [x] Yahtzee (exactly 50)
  - [x] Chance (sum of all dice)
  - [x] Yahtzee bonus (+100 per extra Yahtzee after the first)
- [x] Close on overlay click or Escape key

## 3. Dice Pip Faces
- [x] Replace die number display with SVG pip layout
- [x] Define pip positions for faces 1–6
- [x] Style pips to match the existing dark theme
