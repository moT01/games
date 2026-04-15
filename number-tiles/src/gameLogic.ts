export function generateSolvedBoard(n: number): number[] {
  const tiles: number[] = [];
  for (let i = 1; i < n * n; i++) tiles.push(i);
  tiles.push(0);
  return tiles;
}

export function isSolvable(tiles: number[], n: number): boolean {
  // Count inversions (ignore blank tile 0)
  const filtered = tiles.filter(t => t !== 0);
  let inversions = 0;
  for (let i = 0; i < filtered.length; i++) {
    for (let j = i + 1; j < filtered.length; j++) {
      if (filtered[i] > filtered[j]) inversions++;
    }
  }

  if (n % 2 === 1) {
    // Odd-width board: solvable iff inversions is even
    return inversions % 2 === 0;
  } else {
    // Even-width board: find row of blank from bottom (1-based)
    const blankIndex = tiles.indexOf(0);
    const blankRow = Math.floor(blankIndex / n);
    const rowFromBottom = n - blankRow; // 1-based from bottom
    if (inversions % 2 === 0) {
      return rowFromBottom % 2 === 1; // blank on odd row from bottom
    } else {
      return rowFromBottom % 2 === 0; // blank on even row from bottom
    }
  }
}

export function isSolved(tiles: number[]): boolean {
  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[tiles.length - 1] === 0;
}

export function getValidMoves(tiles: number[], n: number): number[] {
  const blankIndex = tiles.indexOf(0);
  const blankRow = Math.floor(blankIndex / n);
  const blankCol = blankIndex % n;
  const valid: number[] = [];

  // Up: tile above blank
  if (blankRow > 0) valid.push(blankIndex - n);
  // Down: tile below blank
  if (blankRow < n - 1) valid.push(blankIndex + n);
  // Left: tile to the left of blank
  if (blankCol > 0) valid.push(blankIndex - 1);
  // Right: tile to the right of blank
  if (blankCol < n - 1) valid.push(blankIndex + 1);

  return valid;
}

export function moveTile(tiles: number[], tileIndex: number, n: number): number[] | null {
  const blankIndex = tiles.indexOf(0);

  if (tileIndex === blankIndex) return null;

  const valid = getValidMoves(tiles, n);
  if (!valid.includes(tileIndex)) return null;

  const newTiles = [...tiles];
  newTiles[blankIndex] = newTiles[tileIndex];
  newTiles[tileIndex] = 0;
  return newTiles;
}

export function shuffleBoard(tiles: number[], n: number): number[] {
  let shuffled: number[];

  do {
    shuffled = [...tiles];
    // Fisher-Yates shuffle
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
  } while (!isSolvable(shuffled, n) || isSolved(shuffled));

  return shuffled;
}

export function arrowKeyToTileIndex(tiles: number[], n: number, key: string): number | null {
  const blankIndex = tiles.indexOf(0);
  const blankRow = Math.floor(blankIndex / n);
  const blankCol = blankIndex % n;

  // Arrow key direction = direction the tile moves INTO the blank
  // ArrowRight: tile to the LEFT of blank slides right
  // ArrowLeft: tile to the RIGHT of blank slides left
  // ArrowDown: tile ABOVE blank slides down
  // ArrowUp: tile BELOW blank slides up

  switch (key) {
    case 'ArrowRight':
      if (blankCol > 0) return blankIndex - 1;
      break;
    case 'ArrowLeft':
      if (blankCol < n - 1) return blankIndex + 1;
      break;
    case 'ArrowDown':
      if (blankRow > 0) return blankIndex - n;
      break;
    case 'ArrowUp':
      if (blankRow < n - 1) return blankIndex + n;
      break;
  }

  return null;
}
