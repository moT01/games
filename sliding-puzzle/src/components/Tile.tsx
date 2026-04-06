import './Tile.css';

type Props = {
  value: number;
  isValid: boolean;
  onClick: () => void;
};

export function Tile({ value, isValid, onClick }: Props) {
  if (value === 0) {
    return <div className="tile tile--blank" />;
  }

  return (
    <button
      className={`tile${isValid ? ' tile--valid' : ''}`}
      onClick={onClick}
    >
      {value}
    </button>
  );
}
