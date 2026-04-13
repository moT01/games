import './ScoreRow.css';

type ScoreRowProps = {
  label: string;
  score: number | null;
  previewScore: number;
  isLocked: boolean;
  onScore: () => void;
  canScore: boolean;
};

export function ScoreRow({ label, score, previewScore, isLocked, onScore, canScore }: ScoreRowProps) {
  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onScore();
    }
  }

  const displayValue = isLocked ? score : canScore ? previewScore : '—';
  const ariaLabel = isLocked
    ? `${label}: ${score}`
    : canScore
    ? `${label}: score ${previewScore}`
    : `${label}: not available`;

  return (
    <tr
      className={`score-row${isLocked ? ' score-row--locked' : ''}${canScore ? ' score-row--scorable' : ''}`}
      onClick={canScore ? onScore : undefined}
      tabIndex={canScore ? 0 : -1}
      onKeyDown={canScore ? handleKeyDown : undefined}
      aria-label={ariaLabel}
      aria-disabled={!canScore && !isLocked}
    >
      <td className="score-row__label">{label}</td>
      <td className={`score-row__value${!isLocked && canScore ? ' score-row__value--preview' : ''}`}>
        {displayValue}
      </td>
    </tr>
  );
}
