import './HelpModal.css';

interface Props {
  onClose: () => void;
}

export function HelpModal({ onClose }: Props) {
  return (
    <div className="help-modal-overlay" role="dialog" aria-modal="true" aria-label="Help">
      <div className="help-modal">
        <div className="help-modal__header">
          <h2 className="help-modal__title">How to Play</h2>
          <button className="help-modal__close" onClick={onClose} aria-label="Close help">
            x
          </button>
        </div>
        <div className="help-modal__body">
          <section className="help-modal__section">
            <h3>Question Formats</h3>
            <p><strong>Multiple Choice:</strong> Four options (A-D). Pick the one correct answer.</p>
            <p><strong>True / False:</strong> Statement is either True or False. Watch for negations and edge cases.</p>
          </section>
          <section className="help-modal__section">
            <h3>Campaign Structure</h3>
            <table className="help-modal__table">
              <thead>
                <tr><th>Level</th><th>Name</th><th>Questions</th><th>Need</th></tr>
              </thead>
              <tbody>
                <tr><td>1</td><td>Boot Camp</td><td>5</td><td>3</td></tr>
                <tr><td>2</td><td>Junior Dev</td><td>6</td><td>4</td></tr>
                <tr><td>3</td><td>Mid-Level</td><td>8</td><td>6</td></tr>
                <tr><td>4</td><td>Senior Dev</td><td>8</td><td>7</td></tr>
                <tr><td>5</td><td>Principal</td><td>10</td><td>9</td></tr>
              </tbody>
            </table>
          </section>
          <section className="help-modal__section">
            <h3>Best Time</h3>
            <p>Complete the full campaign (all 5 levels) to record a time. Best time is only updated if you achieve a higher score, or the same score in less time.</p>
          </section>
          <section className="help-modal__section">
            <h3>Keyboard Shortcuts</h3>
            <p><strong>1-4</strong> to pick a multiple choice option</p>
            <p><strong>T / F</strong> for True / False</p>
            <p><strong>Escape</strong> to open the quit dialog</p>
          </section>
        </div>
      </div>
    </div>
  );
}
