import { useEffect } from 'react'
import './HelpModal.css'

interface Props {
  onClose: () => void
}

export default function HelpModal({ onClose }: Props) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-label="Help">
      <div className="modal-box help-modal">
        <div className="help-modal__header">
          <h2>How to Play Hearts</h2>
          <button className="btn btn--icon" onClick={onClose} aria-label="Close help">X</button>
        </div>

        <div className="help-modal__body">
          <section>
            <h3>Objective</h3>
            <p>Finish with the lowest score. Each heart = 1 point, Queen of Spades = 13 points. Game ends when any player reaches 100; lowest score wins.</p>
          </section>

          <section>
            <h3>Each Hand</h3>
            <ul>
              <li>Pass 3 cards before play (direction rotates: Left, Right, Across, Keep)</li>
              <li>2 of Clubs always leads the first trick</li>
              <li>Follow suit if you can; highest card of the led suit wins the trick</li>
              <li>Hearts cannot be led until someone "breaks" hearts by discarding one</li>
              <li>No penalty cards (hearts or Q of Spades) on the first trick unless you have no choice</li>
            </ul>
          </section>

          <section>
            <h3>Shoot the Moon</h3>
            <p>Take ALL 13 hearts AND the Queen of Spades in one hand, and all other players get 26 points instead of you.</p>
          </section>

          <section>
            <h3>Key Strategies</h3>
            <ul>
              <li>Pass A or K of Spades unless you also hold the Queen (you would make it unbeatable)</li>
              <li>Pass the Queen of Spades if you have fewer than 3 spades to protect it</li>
              <li>Void yourself in a suit so you can dump the Queen or high hearts on that lead</li>
              <li>Play low cards early to avoid winning tricks that contain penalty cards</li>
              <li>Once the Queen of Spades is played, spades are safe to lead</li>
            </ul>
          </section>

          <section>
            <h3>Common Mistakes</h3>
            <ul>
              <li>Passing A or K of Spades when you also hold the Queen</li>
              <li>Leading spades before the Queen has been played</li>
              <li>Playing a high card when the trick already has penalty cards in it</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
