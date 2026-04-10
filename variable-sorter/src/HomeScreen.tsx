import './HomeScreen.css'
import type { Language, PersonalBests } from './gameLogic'
import { formatTime } from './gameLogic'

interface Props {
  language: Language
  variableCount: 10 | 20 | 30
  personalBests: PersonalBests
  theme: 'light' | 'dark'
  onLanguageChange: (lang: Language) => void
  onCountChange: (count: 10 | 20 | 30) => void
  onStart: () => void
  onToggleTheme: () => void
  onShowHelp: () => void
}

const COUNTS: Array<10 | 20 | 30> = [10, 20, 30]
const LANG_LABELS: Record<Language, string> = { javascript: 'JavaScript', python: 'Python' }

export default function HomeScreen({
  language,
  variableCount,
  personalBests,
  theme,
  onLanguageChange,
  onCountChange,
  onStart,
  onToggleTheme,
  onShowHelp,
}: Props) {
  return (
    <div className="home-screen">
      <div className="home-card">
        <div className="home-header">
          <h1 className="home-title">Variable Sorter</h1>
          <div className="home-header-actions">
            <button
              className="icon-btn"
              onClick={onShowHelp}
              aria-label="Help"
            >
              ?
            </button>
            <button
              className="icon-btn"
              onClick={onToggleTheme}
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? '☀' : '☽'}
            </button>
          </div>
        </div>

        <p className="home-subtitle">Drag each variable into its correct type bucket. One mistake ends your run.</p>

        <section className="home-section">
          <label className="section-label">Language</label>
          <div className="lang-toggle" role="group" aria-label="Select language">
            {(['javascript', 'python'] as Language[]).map(lang => (
              <button
                key={lang}
                className={`lang-btn${language === lang ? ' active' : ''}`}
                onClick={() => onLanguageChange(lang)}
                aria-pressed={language === lang}
              >
                {LANG_LABELS[lang]}
              </button>
            ))}
          </div>
        </section>

        <section className="home-section">
          <label className="section-label">Variables</label>
          <div className="count-selector" role="group" aria-label="Select variable count">
            {COUNTS.map(c => (
              <button
                key={c}
                className={`count-btn${variableCount === c ? ' active' : ''}`}
                onClick={() => onCountChange(c)}
                aria-pressed={variableCount === c}
              >
                {c}
              </button>
            ))}
          </div>
        </section>

        <section className="home-section">
          <label className="section-label">Best Times</label>
          <table className="best-times-table" aria-label="Personal best times">
            <thead>
              <tr>
                <th>Language</th>
                {COUNTS.map(c => <th key={c}>{c} vars</th>)}
              </tr>
            </thead>
            <tbody>
              {(['javascript', 'python'] as Language[]).map(lang => (
                <tr key={lang}>
                  <td>{LANG_LABELS[lang]}</td>
                  {COUNTS.map(c => (
                    <td key={c} className="best-time-cell">
                      {personalBests[lang][c] !== null
                        ? formatTime(personalBests[lang][c]!)
                        : <span className="no-time">--</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <button className="start-btn" onClick={onStart} aria-label="Start game">
          Start
        </button>

        <a
          className="donate-btn"
          href="https://www.freecodecamp.org/donate"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Donate to freeCodeCamp"
        >
          Donate
        </a>
      </div>
    </div>
  )
}
