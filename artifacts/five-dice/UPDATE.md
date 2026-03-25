# Five Dice — Update Checklist

## 1. UI Scaling
- [ ] Increase dice size so they fill more of the left panel
- [ ] Widen the scorecard to better use available space
- [ ] Review DiceArea layout — ensure it fills the left column naturally
- [ ] Check overall `.app` layout fills the window without feeling sparse

## 2. Rules Modal
- [ ] Add a "Rules" button (top of DiceArea or app header)
- [ ] Create a `RulesModal` component with overlay
- [ ] Write rules content covering:
  - [ ] Upper section (ones–sixes: sum of that face value)
  - [ ] Upper bonus (score ≥ 63 → +35)
  - [ ] 3 of a Kind / 4 of a Kind (sum of all dice)
  - [ ] Full House (exactly 25)
  - [ ] Small Straight (exactly 30)
  - [ ] Large Straight (exactly 40)
  - [ ] Yahtzee (exactly 50)
  - [ ] Chance (sum of all dice)
  - [ ] Yahtzee bonus (+100 per extra Yahtzee after the first)
- [ ] Close on overlay click or Escape key

## 3. Dice Pip Faces
- [ ] Replace die number display with SVG pip layout
- [ ] Define pip positions for faces 1–6
- [ ] Style pips to match the existing dark theme
