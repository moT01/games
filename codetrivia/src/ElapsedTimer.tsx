import { useEffect, useState } from 'react';
import './ElapsedTimer.css';

interface Props {
  startTime: number;
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function ElapsedTimer({ startTime }: Props) {
  const [elapsed, setElapsed] = useState(() => Date.now() - startTime);

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  return (
    <span className="elapsed-timer" aria-label="Elapsed time">
      {formatTime(elapsed)}
    </span>
  );
}
