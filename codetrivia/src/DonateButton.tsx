import './DonateButton.css';

export function DonateButton() {
  return (
    <a
      className="donate-btn"
      href="https://www.freecodecamp.org/donate"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Donate to freeCodeCamp"
    >
      Donate
    </a>
  );
}
