export function generateSolvedTiles(size: number): number[] {
  const total = size * size;
  const tiles: number[] = [];
  for (let i = 1; i < total; i++) tiles.push(i);
  tiles.push(0);
  return tiles;
}

export function getBlankIndex(tiles: number[]): number {
  return tiles.indexOf(0);
}

export function getValidMoveIndices(tiles: number[], size: number): number[] {
  const blank = getBlankIndex(tiles);
  const blankRow = Math.floor(blank / size);
  const blankCol = blank % size;
  const valid: number[] = [];

  // up: tile above blank
  if (blankRow > 0) valid.push(blank - size);
  // down: tile below blank
  if (blankRow < size - 1) valid.push(blank + size);
  // left: tile to the left of blank
  if (blankCol > 0) valid.push(blank - 1);
  // right: tile to the right of blank
  if (blankCol < size - 1) valid.push(blank + 1);

  return valid;
}

export function moveTile(tiles: number[], tileIndex: number, size: number): number[] | null {
  const valid = getValidMoveIndices(tiles, size);
  if (!valid.includes(tileIndex)) return null;

  const next = [...tiles];
  const blank = getBlankIndex(tiles);
  next[blank] = next[tileIndex];
  next[tileIndex] = 0;
  return next;
}

export function shiftLine(tiles: number[], tileIndex: number, size: number): number[] | null {
  const blank = getBlankIndex(tiles);
  if (tileIndex === blank) return null;

  const tileRow = Math.floor(tileIndex / size);
  const tileCol = tileIndex % size;
  const blankRow = Math.floor(blank / size);
  const blankCol = blank % size;

  if (tileRow === blankRow) {
    // same row — slide horizontally
    const next = [...tiles];
    const step = tileCol < blankCol ? 1 : -1;
    let cur = blank;
    while (cur !== tileIndex) {
      const src = cur + step;
      next[cur] = next[src];
      cur = src;
    }
    next[tileIndex] = 0;
    return next;
  }

  if (tileCol === blankCol) {
    // same column — slide vertically
    const next = [...tiles];
    const step = tileRow < blankRow ? size : -size;
    let cur = blank;
    while (cur !== tileIndex) {
      const src = cur + step;
      next[cur] = next[src];
      cur = src;
    }
    next[tileIndex] = 0;
    return next;
  }

  return null;
}

export function getTileIndexByDirection(
  tiles: number[],
  size: number,
  direction: 'up' | 'down' | 'left' | 'right'
): number | null {
  const blank = getBlankIndex(tiles);
  const blankRow = Math.floor(blank / size);
  const blankCol = blank % size;

  // Arrow direction = direction blank moves; tile is on the opposite side
  switch (direction) {
    case 'up':
      return blankRow < size - 1 ? blank + size : null;
    case 'down':
      return blankRow > 0 ? blank - size : null;
    case 'left':
      return blankCol < size - 1 ? blank + 1 : null;
    case 'right':
      return blankCol > 0 ? blank - 1 : null;
  }
}

export function isSolved(tiles: number[], size: number): boolean {
  const solved = generateSolvedTiles(size);
  return tiles.every((v, i) => v === solved[i]);
}

export function shuffle(tiles: number[], size: number): number[] {
  const moveCount = size === 3 ? 50 : size === 5 ? 300 : 200;
  let current = [...tiles];

  for (let i = 0; i < moveCount; i++) {
    const valid = getValidMoveIndices(current, size);
    const pick = valid[Math.floor(Math.random() * valid.length)];
    const blank = getBlankIndex(current);
    const next = [...current];
    next[blank] = next[pick];
    next[pick] = 0;
    current = next;
  }

  // Guard: re-shuffle (extremely unlikely) if we ended up solved
  if (isSolved(current, size)) {
    return shuffle(current, size);
  }

  return current;
}
