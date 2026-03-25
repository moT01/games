STATUS: REVISE

## Feedback

1. **Game Logic / State Flags — `canAutoComplete` condition is ambiguous:** The plan defines `autoCompleteAvailable` as true when "stock is empty and all tableau cards are face-up" but does not say whether the waste pile must also be empty. If cards remain in the waste when stock runs out, those waste cards are face-up and still need to be moved — a developer could reasonably interpret the condition either way. Clarify: should `canAutoComplete` require `stock.length === 0 && waste.length === 0 && allTableauFaceUp`, or is `waste.length > 0` acceptable (auto-complete handles waste cards too)? Update the `canAutoComplete` description in both the Game Logic checklist and the State Flags section to match.
