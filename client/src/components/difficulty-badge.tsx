import styled from 'styled-components';
import type { Difficulty } from '../types/question';

const COLORS = {
  EASY: { bg: 'var(--green-light)', text: 'var(--green)' },
  MEDIUM: { bg: 'var(--orange-light)', text: 'var(--orange)' },
  HARD: { bg: 'var(--red-light)', text: 'var(--red)' },
};

const Badge = styled.span<{ $difficulty: Difficulty }>`
  padding: 3px 10px;
  border-radius: 980px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  background: ${({ $difficulty }) => COLORS[$difficulty].bg};
  color: ${({ $difficulty }) => COLORS[$difficulty].text};
`;

export const DifficultyBadge = ({ difficulty }: { difficulty: Difficulty }) => (
  <Badge $difficulty={difficulty}>{difficulty}</Badge>
);
