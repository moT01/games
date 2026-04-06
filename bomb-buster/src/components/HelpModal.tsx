import './HelpModal.css';

type Props = { onClose: () => void };

export function HelpModal({ onClose }: Props) {
  return (
    <div className="help-modal__backdrop" onClick={onClose}>
      <div className="help-modal" onClick={e => e.stopPropagation()}>
        <button className="help-modal__close" onClick={onClose} title="Close">✕</button>
        <h2 className="help-modal__title">System Documentation</h2>

        <h3 className="help-modal__section">Operational Protocols</h3>
        <p>Left-click to probe a sector. Right-click to deploy or retract a firewall shield (🛡️). Numbers indicate how many of the 8 adjacent sectors contain active viruses (👾). Purge all safe sectors without triggering a virus to secure the system.</p>

        <h3 className="help-modal__section">Mission Objective</h3>
        <p>Expose every sector that does not contain a virus. Deploying firewalls is optional but helps track detected threats.</p>

        <h3 className="help-modal__section">Tactical Strategies</h3>
        <ul className="help-modal__list">
          <li>If a "1" sector touches only one unrevealed sector, that sector contains a virus — shield it.</li>
          <li>If a sector's adjacent shield count matches its number, all other unrevealed neighbors are safe to probe.</li>
          <li>Identify sectors where the virus count matches all remaining unrevealed neighbors — every one of them is a threat.</li>
          <li>Perimeter sectors have fewer neighbors, making them easier to analyze.</li>
          <li>When logic fails, probing perimeter sectors is statistically safer.</li>
        </ul>

        <h3 className="help-modal__section">Initialization Data</h3>
        <ul className="help-modal__list">
          <li>The initial probe is always safe — viruses are initialized after the first interaction.</li>
          <li>Start with Protocol 1 (9×9, 10 viruses) to calibrate your detection algorithms.</li>
          <li>Initialize probes in corners — they often trigger a cascade, exposing safe zones quickly.</li>
        </ul>

        <h3 className="help-modal__section">Critical Error Prevention</h3>
        <ul className="help-modal__list">
          <li>The threat counter may fluctuate if you over-deploy shields — cross-reference with logic.</li>
          <li>Do not attempt to shield every virus before probing safe sectors — efficiency is key.</li>
          <li>Exercise caution near detected threats — rapid probes can lead to accidental detonation.</li>
        </ul>
      </div>
    </div>
  );
}
