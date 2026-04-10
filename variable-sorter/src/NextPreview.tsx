import type { Variable } from './gameLogic'
import { tokenize } from './tokenize'

interface Props {
  variable: Variable | null
}

export default function NextPreview({ variable }: Props) {
  return (
    <div className="next-preview" aria-label={variable ? `Next variable: ${variable.declaration}` : 'No more variables'}>
      <span className="next-label">Next</span>
      {variable ? (
        <code className="next-declaration">
          {tokenize(variable.declaration).map((tok, i) => (
            <span key={i} className={tok.cls || undefined}>{tok.text}</span>
          ))}
        </code>
      ) : (
        <span className="next-empty">Last one!</span>
      )}
    </div>
  )
}
