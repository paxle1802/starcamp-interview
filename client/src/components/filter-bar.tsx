import styled from 'styled-components';
import type { Difficulty } from '../types/question';

const Container = styled.div`
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
`;

const Select = styled.select`
  padding: 9px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-secondary);
  outline: none;
  cursor: pointer;
  transition: all var(--transition);

  &:focus {
    border-color: var(--border-focused);
    box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.12);
  }
`;

const Input = styled.input`
  padding: 9px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-secondary);
  flex: 1;
  outline: none;
  transition: all var(--transition);

  &:focus {
    border-color: var(--border-focused);
    box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.12);
  }

  &::placeholder { color: var(--text-tertiary); }
`;

interface Props {
  difficulty: Difficulty | 'ALL';
  tags: string;
  onDifficultyChange: (difficulty: Difficulty | 'ALL') => void;
  onTagsChange: (tags: string) => void;
}

export const FilterBar = ({ difficulty, tags, onDifficultyChange, onTagsChange }: Props) => (
  <Container>
    <Select value={difficulty} onChange={(e) => onDifficultyChange(e.target.value as Difficulty | 'ALL')}>
      <option value="ALL">All Difficulties</option>
      <option value="EASY">Easy</option>
      <option value="MEDIUM">Medium</option>
      <option value="HARD">Hard</option>
    </Select>
    <Input
      placeholder="Filter by tags (comma-separated)"
      value={tags}
      onChange={(e) => onTagsChange(e.target.value)}
    />
  </Container>
);
