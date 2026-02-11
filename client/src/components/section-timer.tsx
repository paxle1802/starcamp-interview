import { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
`;

const Container = styled.div`
  text-align: center;
  margin: 16px 0;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
`;

const TimerDisplay = styled.div<{ $warning: boolean }>`
  font-size: 44px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -1px;
  color: ${({ $warning }) => ($warning ? 'var(--red)' : 'var(--text-primary)')};
  animation: ${({ $warning }) => $warning ? pulse : 'none'} 1.5s ease-in-out infinite;
`;

const TimerLabel = styled.p`
  font-size: 12px;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 2px;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background: var(--bg-tertiary);
  border-radius: 2px;
  margin-top: 14px;
  overflow: hidden;
`;

const Progress = styled.div<{ $percent: number; $warning: boolean }>`
  height: 100%;
  width: ${({ $percent }) => $percent}%;
  background: ${({ $warning }) => ($warning ? 'var(--red)' : 'var(--accent)')};
  border-radius: 2px;
  transition: width 0.1s linear;
`;

interface Props {
  startTime: Date;
  durationMinutes: number;
}

export const SectionTimer = ({ startTime, durationMinutes }: Props) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(new Date().getTime() - startTime.getTime());
    }, 100);
    return () => clearInterval(interval);
  }, [startTime]);

  const totalMs = durationMinutes * 60 * 1000;
  const remaining = Math.max(0, totalMs - elapsed);
  const percent = Math.min(100, (elapsed / totalMs) * 100);
  const warning = remaining < 60000;

  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  return (
    <Container>
      <TimerDisplay $warning={warning}>
        {minutes}:{seconds.toString().padStart(2, '0')}
      </TimerDisplay>
      <TimerLabel>remaining</TimerLabel>
      <ProgressBar>
        <Progress $percent={percent} $warning={warning} />
      </ProgressBar>
    </Container>
  );
};
