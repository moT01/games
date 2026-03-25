import type { Choice } from '../gameLogic';
import './ChoiceButton.css';

const icons: Record<Choice, string> = {
  rock: '✊',
  paper: '✋',
  scissors: '✌️',
};

interface ChoiceButtonProps {
  choice: Choice;
  onClick: (choice: Choice) => void;
  disabled: boolean;
}

export function ChoiceButton({ choice, onClick, disabled }: ChoiceButtonProps) {
  return (
    <button
      className="choice-button"
      onClick={() => onClick(choice)}
      disabled={disabled}
    >
      <span className="choice-button__icon">{icons[choice]}</span>
      <span className="choice-button__label">{choice.charAt(0).toUpperCase() + choice.slice(1)}</span>
    </button>
  );
}
