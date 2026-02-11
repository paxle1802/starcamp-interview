import styled from 'styled-components';

const Container = styled.div`
  margin-top: 24px;
  padding: 20px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
`;

const Title = styled.h3`
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
`;

const ScoreOptions = styled.div`
  display: flex;
  gap: 8px;
  margin: 14px 0 18px;
`;

const SCORE_COLORS: Record<number, { bg: string; border: string; text: string; hoverBg: string }> = {
  1: { bg: '#fff0f0', border: '#ff3b30', text: '#ff3b30', hoverBg: '#ffe5e5' },
  2: { bg: '#fff8f0', border: '#ff9500', text: '#e08600', hoverBg: '#ffefdb' },
  3: { bg: '#fffcf0', border: '#ffcc00', text: '#b38f00', hoverBg: '#fff5cc' },
  4: { bg: '#f0faf2', border: '#34c759', text: '#2da44e', hoverBg: '#e0f5e5' },
  5: { bg: '#eef8ff', border: '#0071e3', text: '#0071e3', hoverBg: '#dceeff' },
};

const ScoreOption = styled.label<{ $selected: boolean; $value: number }>`
  flex: 1;
  text-align: center;
  padding: 14px 8px;
  border: 2px solid ${({ $selected, $value }) =>
    $selected ? SCORE_COLORS[$value].border : 'var(--border)'};
  border-radius: var(--radius-md);
  cursor: pointer;
  background: ${({ $selected, $value }) =>
    $selected ? SCORE_COLORS[$value].bg : 'var(--bg-secondary)'};
  transition: all var(--transition);
  position: relative;

  ${({ $selected, $value }) => $selected && `
    box-shadow: 0 0 0 3px ${SCORE_COLORS[$value].border}22;
  `}

  &:hover {
    border-color: ${({ $value }) => SCORE_COLORS[$value].border};
    background: ${({ $value }) => SCORE_COLORS[$value].hoverBg};
    transform: translateY(-1px);
  }

  &:active { transform: translateY(0); }

  input { display: none; }
`;

const ScoreNum = styled.div<{ $selected: boolean; $value: number }>`
  font-size: 24px;
  font-weight: 800;
  color: ${({ $selected, $value }) =>
    $selected ? SCORE_COLORS[$value].text : 'var(--text-secondary)'};
  transition: all var(--transition);
`;

const ScoreLabel = styled.div<{ $selected: boolean; $value: number }>`
  font-size: 10px;
  color: ${({ $selected, $value }) =>
    $selected ? SCORE_COLORS[$value].text : 'var(--text-tertiary)'};
  margin-top: 4px;
  letter-spacing: 0.2px;
  font-weight: ${({ $selected }) => $selected ? '600' : '400'};
  transition: all var(--transition);
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 80px;
  padding: 12px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: inherit;
  font-size: 14px;
  color: var(--text-primary);
  resize: vertical;
  margin-top: 8px;
  outline: none;
  transition: all var(--transition);
  background: var(--bg-tertiary);

  &:focus {
    border-color: var(--border-focused);
    background: var(--bg-secondary);
    box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.12);
  }

  &::placeholder { color: var(--text-tertiary); }
`;

const SCORE_LABELS: Record<number, string> = {
  1: 'Poor',
  2: 'Needs Work',
  3: 'Average',
  4: 'Good',
  5: 'Excellent',
};

interface Props {
  score?: number;
  notes?: string;
  onScoreChange: (score: number) => void;
  onNotesChange: (notes: string) => void;
}

export const ScoringPanel = ({ score, notes, onScoreChange, onNotesChange }: Props) => (
  <Container>
    <Title>Score this answer</Title>
    <ScoreOptions>
      {[1, 2, 3, 4, 5].map((s) => (
        <ScoreOption key={s} $selected={score === s} $value={s}>
          <input
            type="radio"
            name="score"
            value={s}
            checked={score === s}
            onChange={() => onScoreChange(s)}
          />
          <ScoreNum $selected={score === s} $value={s}>{s}</ScoreNum>
          <ScoreLabel $selected={score === s} $value={s}>{SCORE_LABELS[s]}</ScoreLabel>
        </ScoreOption>
      ))}
    </ScoreOptions>

    <label>
      <Title as="span" style={{ fontSize: 13 }}>Notes</Title>
      <Textarea
        placeholder="Add notes about this answer..."
        value={notes || ''}
        onChange={(e) => onNotesChange(e.target.value)}
      />
    </label>
  </Container>
);
