export function createGoalState(size: number): number[] {
  const n = size * size;
  const tiles: number[] = [];
  for (let i = 1; i < n; i++) tiles.push(i);
  tiles.push(0);
  return tiles;
}

export function isSolvable(tiles: number[], size: number): boolean {
  const nonZero = tiles.filter(t => t !== 0);
  let inversions = 0;
  for (let i = 0; i < nonZero.length; i++) {
    for (let j = i + 1; j < nonZero.length; j++) {
      if (nonZero[i] > nonZero[j]) inversions++;
    }
  }

  if (size % 2 === 1) {
    // Odd grid: solvable iff inversions is even
    return inversions % 2 === 0;
  } else {
    // Even grid: solvable iff (inversions + row of blank from bottom) is odd
    const blankIndex = tiles.indexOf(0);
    const blankRow = Math.floor(blankIndex / size);
    const rowFromBottom = size - blankRow;
    return (inversions + rowFromBottom) % 2 === 1;
  }
}

export function shuffle(size: number): number[] {
  const goal = createGoalState(size);
  let tiles: number[];
  do {
    tiles = [...goal];
    // Fisher-Yates
    for (let i = tiles.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
    }
  } while (!isSolvable(tiles, size) || isSolved(tiles));
  return tiles;
}

export function getBlankIndex(tiles: number[]): number {
  return tiles.indexOf(0);
}

export function getAdjacentToBlank(tiles: number[], size: number): number[] {
  const blankIdx = getBlankIndex(tiles);
  const row = Math.floor(blankIdx / size);
  const col = blankIdx % size;
  const adjacent: number[] = [];

  if (row > 0) adjacent.push((row - 1) * size + col); // above
  if (row < size - 1) adjacent.push((row + 1) * size + col); // below
  if (col > 0) adjacent.push(row * size + (col - 1)); // left
  if (col < size - 1) adjacent.push(row * size + (col + 1)); // right

  return adjacent;
}

export function slideTile(tiles: number[], tileIndex: number): number[] {
  const blankIdx = getBlankIndex(tiles);
  const next = [...tiles];
  next[blankIdx] = next[tileIndex];
  next[tileIndex] = 0;
  return next;
}

export function isSolved(tiles: number[]): boolean {
  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i] !== i + 1) return false;
  }
  return tiles[tiles.length - 1] === 0;
}
