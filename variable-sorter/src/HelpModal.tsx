import './HelpModal.css'
import type { Language } from './gameLogic'

interface Props {
  language: Language
  onClose: () => void
}

const JS_TYPES = [
  { type: 'string', example: 'const x = "hello"', note: 'Text in double or single quotes' },
  { type: 'number', example: 'let n = 42', note: 'Any numeric value, including floats and negatives' },
  { type: 'boolean', example: 'const ok = true', note: 'true or false (lowercase)' },
  { type: 'null', example: 'let x = null', note: 'Explicit empty value (intentional absence)' },
  { type: 'undefined', example: 'let x = undefined', note: 'Declared but not assigned' },
  { type: 'object', example: 'const u = { id: 1 }', note: 'Key-value pairs in curly braces' },
  { type: 'array', example: 'const a = [1, 2]', note: 'Ordered list in square brackets' },
  { type: 'function', example: 'const f = () => 1', note: 'Arrow functions or function keyword' },
]

const PY_TYPES = [
  { type: 'str', example: 'name = "Alice"', note: 'Text in quotes' },
  { type: 'int', example: 'count = 42', note: 'Whole numbers only (no decimal point)' },
  { type: 'float', example: 'price = 3.14', note: 'Has a decimal point' },
  { type: 'bool', example: 'active = True', note: 'True or False (capital first letter)' },
  { type: 'None', example: 'result = None', note: 'Python equivalent of null' },
  { type: 'list', example: 'items = [1, 2]', note: 'Ordered, in square brackets' },
  { type: 'dict', example: 'u = {"id": 1}', note: 'Key-value pairs with colons inside braces' },
  { type: 'tuple', example: 'pt = (1, 2)', note: 'Ordered, immutable, in parentheses' },
  { type: 'set', example: 'ids = {1, 2}', note: 'Unique values in braces, no colons' },
]

export default function HelpModal({ language, onClose }: Props) {
  const types = language === 'javascript' ? JS_TYPES : PY_TYPES
  const langLabel = language === 'javascript' ? 'JavaScript' : 'Python'

  function handleBackdropClick(e: React.MouseEvent) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick} role="dialog" aria-modal="true" aria-label="Help">
      <div className="modal-box help-modal">
        <div className="modal-header">
          <h2 className="modal-title">{langLabel} Types</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close help">&#215;</button>
        </div>

        <div className="help-content">
          <p className="help-intro">
            Drag each variable to the bucket that matches its type. One wrong drop ends your run.
          </p>

          <table className="type-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Example</th>
                <th>Tip</th>
              </tr>
            </thead>
            <tbody>
              {types.map(({ type, example, note }) => (
                <tr key={type}>
                  <td><code className="type-tag">{type}</code></td>
                  <td><code className="type-example">{example}</code></td>
                  <td className="type-note">{note}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="help-tip">
            <strong>Keyboard shortcuts:</strong> Press 1-9 to sort into a bucket without dragging. Bucket order matches left to right.
          </div>
        </div>
      </div>
    </div>
  )
}
