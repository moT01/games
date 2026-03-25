import './SetupScreen.css';

type Props = {
  onStart: (drawMode: 1 | 3) => void;
};

export function SetupScreen({ onStart }: Props) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const mode = Number(data.get('drawMode')) as 1 | 3;
    onStart(mode);
  };

  return (
    <div className="setup-screen">
      <h1 className="setup-title">Solitaire</h1>
      <form className="setup-form" onSubmit={handleSubmit}>
        <fieldset className="setup-fieldset">
          <legend className="setup-legend">Draw Mode</legend>
          <label className="setup-option">
            <input type="radio" name="drawMode" value="1" defaultChecked />
            Draw 1
          </label>
          <label className="setup-option">
            <input type="radio" name="drawMode" value="3" />
            Draw 3
          </label>
        </fieldset>
        <button type="submit" className="btn btn-primary">New Game</button>
      </form>
    </div>
  );
}
