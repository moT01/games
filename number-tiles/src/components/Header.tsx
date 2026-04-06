interface HeaderProps {
  onHelp: () => void;
}

export default function Header({ onHelp }: HeaderProps) {
  return (
    <header className="header">
      <h1 className="header__title">Number Tiles</h1>
      <button className="header__help-btn" onClick={onHelp} aria-label="Help">
        ?
      </button>
    </header>
  );
}
