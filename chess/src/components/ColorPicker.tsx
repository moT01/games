import './ColorPicker.css';

interface Props {
  onConfirm: (color: 'white' | 'black' | 'random') => void;
}

export function ColorPicker({ onConfirm }: Props) {
  return (
    <div className="color-picker">
      <h2>Play as...</h2>
      <button onClick={() => onConfirm('white')}>White</button>
      <button onClick={() => onConfirm('black')}>Black</button>
      <button onClick={() => onConfirm('random')}>Random</button>
    </div>
  );
}
