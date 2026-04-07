import './Controls.css';

interface ControlsProps {
  onLeft: () => void;
  onRight: () => void;
  onRotateCW: () => void;
  onRotateCCW: () => void;
  onSoftDrop: () => void;
  onHardDrop: () => void;
}

export default function Controls({
  onLeft, onRight, onRotateCW, onRotateCCW, onSoftDrop, onHardDrop,
}: ControlsProps) {
  return (
    <div className="controls">
      <div className="controls__row">
        <button className="controls__btn" onClick={onRotateCCW} aria-label="Rotate counter-clockwise">↺</button>
        <button className="controls__btn" onClick={onRotateCW} aria-label="Rotate clockwise">↻</button>
      </div>
      <div className="controls__row">
        <button className="controls__btn" onClick={onLeft} aria-label="Move left">←</button>
        <button className="controls__btn" onClick={onSoftDrop} aria-label="Soft drop">↓</button>
        <button className="controls__btn" onClick={onRight} aria-label="Move right">→</button>
      </div>
      <div className="controls__row">
        <button className="controls__btn controls__btn--wide" onClick={onHardDrop} aria-label="Hard drop">Hard Drop</button>
      </div>
    </div>
  );
}
