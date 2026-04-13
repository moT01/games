STATUS: REVISE

## Issues
1. `solitaire/src/gameLogic.test.ts` line 244 — `targetCol` is declared but never used. `noUnusedLocals: true` is set in tsconfig.app.json, so this will cause a TypeScript compilation error. Remove the declaration.

2. `solitaire/src/gameLogic.test.ts` line 262 — `twoH` is declared but never used. Same `noUnusedLocals` rule applies. Remove the declaration.
