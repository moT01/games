export interface Token {
  text: string
  cls: string
}

export function tokenize(declaration: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < declaration.length) {
    const rest = declaration.slice(i)

    // Whitespace
    const wsMatch = rest.match(/^\s+/)
    if (wsMatch) {
      tokens.push({ text: wsMatch[0], cls: '' })
      i += wsMatch[0].length
      continue
    }

    // Arrow
    if (rest.startsWith('=>')) {
      tokens.push({ text: '=>', cls: 'token-kw' })
      i += 2
      continue
    }

    // Keywords
    const kwMatch = rest.match(/^(const|let|var|function|return|typeof|void|new|class|not|for|in|and|or|lambda|if|else|while|import|from|with|as|yield|del|raise|pass|break|continue|global|nonlocal|assert|except|try|finally)\b/)
    if (kwMatch) {
      tokens.push({ text: kwMatch[0], cls: 'token-kw' })
      i += kwMatch[0].length
      continue
    }

    // Literals
    const litMatch = rest.match(/^(true|false|null|undefined|None|True|False)\b/)
    if (litMatch) {
      tokens.push({ text: litMatch[0], cls: 'token-lit' })
      i += litMatch[0].length
      continue
    }

    // NaN and Infinity as number tokens
    const nanInfMatch = rest.match(/^(NaN|Infinity)\b/)
    if (nanInfMatch) {
      tokens.push({ text: nanInfMatch[0], cls: 'token-num' })
      i += nanInfMatch[0].length
      continue
    }

    // String (double-quoted or single-quoted)
    if (rest[0] === '"' || rest[0] === "'") {
      const quote = rest[0]
      let j = 1
      while (j < rest.length && rest[j] !== quote) j++
      j++
      tokens.push({ text: rest.slice(0, j), cls: 'token-str' })
      i += j
      continue
    }

    // Number (including negative, scientific notation)
    const numMatch = rest.match(/^-?\d+(\.\d+)?([eE][+-]?\d+)?/)
    if (numMatch) {
      // Only treat as negative if previous token isn't an identifier
      const prev = tokens[tokens.length - 1]
      const isNeg = rest[0] === '-'
      if (!isNeg || !prev || /[^a-zA-Z0-9_]/.test(prev.text.slice(-1))) {
        tokens.push({ text: numMatch[0], cls: 'token-num' })
        i += numMatch[0].length
        continue
      }
    }

    // Identifier
    const identMatch = rest.match(/^[a-zA-Z_]\w*/)
    if (identMatch) {
      tokens.push({ text: identMatch[0], cls: '' })
      i += identMatch[0].length
      continue
    }

    // Fallback: single char
    tokens.push({ text: rest[0], cls: 'token-punct' })
    i++
  }

  return tokens
}
