import './HomeScreen.css'
import type { Language, PersonalBests, Difficulty } from './gameLogic'
import { formatTime } from './gameLogic'

interface Props {
  language: Language
  difficulty: Difficulty
  personalBests: PersonalBests
  theme: 'light' | 'dark'
  onLanguageChange: (lang: Language) => void
  onDifficultyChange: (difficulty: Difficulty) => void
  onStart: () => void
  onToggleTheme: () => void
  onShowHelp: () => void
}

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard']
const DIFF_LABELS: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' }
const LANG_LABELS: Record<Language, string> = { javascript: 'JavaScript', python: 'Python' }

export default function HomeScreen({
  language,
  difficulty,
  personalBests,
  theme,
  onLanguageChange,
  onDifficultyChange,
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
          <label className="section-label">Difficulty</label>
          <div className="count-selector" role="group" aria-label="Select difficulty">
            {DIFFICULTIES.map(d => (
              <button
                key={d}
                className={`count-btn${difficulty === d ? ' active' : ''}`}
                onClick={() => onDifficultyChange(d)}
                aria-pressed={difficulty === d}
              >
                {DIFF_LABELS[d]}
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
                {DIFFICULTIES.map(d => <th key={d}>{DIFF_LABELS[d]}</th>)}
              </tr>
            </thead>
            <tbody>
              {(['javascript', 'python'] as Language[]).map(lang => (
                <tr key={lang}>
                  <td>{LANG_LABELS[lang]}</td>
                  {DIFFICULTIES.map(d => (
                    <td key={d} className="best-time-cell">
                      {personalBests[lang][d] !== null
                        ? formatTime(personalBests[lang][d]!)
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
