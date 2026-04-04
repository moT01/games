export type GameStatus = 'idle' | 'playing' | 'won' | 'lost';
export type Difficulty = 'beginner' | 'intermediate' | 'expert' | 'custom';
export type Config = {
  rows: number;
  cols: number;
  bombs: number;
  difficulty: Difficulty;
};

export type Cell = {
  isBomb: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentCount: number;
};

export function createEmptyBoard(rows: number, cols: number): Cell[] {
  return Array.from({ length: rows * cols }, () => ({
    isBomb: false,
    isRevealed: false,
    isFlagged: false,
    adjacentCount: 0,
  }));
}

export function getNeighborIndices(index: number, rows: number, cols: number): number[] {
  const row = Math.floor(index / cols);
  const col = index % cols;
  const neighbors: number[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
        neighbors.push(nr * cols + nc);
      }
    }
  }
  return neighbors;
}

export function calculateAdjacentCounts(cells: Cell[], rows: number, cols: number): Cell[] {
  return cells.map((cell, index) => {
    if (cell.isBomb) return cell;
    const count = getNeighborIndices(index, rows, cols).filter(i => cells[i].isBomb).length;
    return { ...cell, adjacentCount: count };
  });
}

export function placeBombs(
  cells: Cell[],
  rows: number,
  cols: number,
  bombs: number,
  safeIndex: number
): Cell[] {
  const safeSet = new Set(getNeighborIndices(safeIndex, rows, cols));
  safeSet.add(safeIndex);

  const available: number[] = [];
  for (let i = 0; i < cells.length; i++) {
    if (!safeSet.has(i)) available.push(i);
  }

  // Fisher-Yates shuffle, take first `bombs` elements
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }

  const bombIndices = new Set(available.slice(0, bombs));
  const updated = cells.map((cell, i) => ({
    ...cell,
    isBomb: bombIndices.has(i),
  }));

  return calculateAdjacentCounts(updated, rows, cols);
}

export function revealCells(cells: Cell[], index: number, rows: number, cols: number): Cell[] {
  const updated = cells.map(c => ({ ...c }));
  const queue: number[] = [index];
  const visited = new Set<number>();

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);

    const cell = updated[current];
    if (cell.isRevealed || cell.isFlagged) continue;

    cell.isRevealed = true;

    if (cell.adjacentCount === 0 && !cell.isBomb) {
      for (const neighbor of getNeighborIndices(current, rows, cols)) {
        if (!visited.has(neighbor) && !updated[neighbor].isRevealed && !updated[neighbor].isFlagged) {
          queue.push(neighbor);
        }
      }
    }
  }

  return updated;
}

export function toggleFlag(cells: Cell[], index: number): Cell[] {
  const cell = cells[index];
  if (cell.isRevealed) return cells;
  return cells.map((c, i) =>
    i === index ? { ...c, isFlagged: !c.isFlagged } : c
  );
}

export function checkWin(cells: Cell[]): boolean {
  return cells.every(cell => cell.isBomb || cell.isRevealed);
}

export function countFlags(cells: Cell[]): number {
  return cells.filter(c => c.isFlagged).length;
}

export function revealAllBombs(cells: Cell[]): Cell[] {
  return cells.map(c => (c.isBomb ? { ...c, isRevealed: true } : c));
}
