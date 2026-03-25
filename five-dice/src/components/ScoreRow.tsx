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
  return (
    <tr
      className={`score-row${isLocked ? ' score-row--locked' : ''}${canScore ? ' score-row--scorable' : ''}`}
      onClick={canScore ? onScore : undefined}
    >
      <td className="score-row__label">{label}</td>
      <td className={`score-row__value${!isLocked && canScore ? ' score-row__value--preview' : ''}`}>
        {isLocked ? score : canScore ? previewScore : '—'}
      </td>
    </tr>
  );
}
