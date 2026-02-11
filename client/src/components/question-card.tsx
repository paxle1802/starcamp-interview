import styled from 'styled-components';
import type { Question } from '../types/question';
import { DifficultyBadge } from './difficulty-badge';

const Card = styled.div`
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 16px 20px;
  margin-bottom: 10px;
  cursor: pointer;
  background: var(--bg-secondary);
  transition: all var(--transition);

  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
`;

const QuestionText = styled.p`
  margin: 0;
  color: var(--text-primary);
  font-size: 14px;
  line-height: 1.6;
`;

const Tags = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 10px;
  flex-wrap: wrap;
`;

const Tag = styled.span`
  background: var(--bg-tertiary);
  padding: 2px 10px;
  border-radius: 980px;
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 500;
`;

const Actions = styled.div`
  display: flex;
  gap: 6px;
`;

const ActionBtn = styled.button`
  padding: 5px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all var(--transition);

  &:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }
`;

const DeleteBtn = styled(ActionBtn)`
  color: var(--red);

  &:hover {
    background: var(--red-light);
    border-color: var(--red);
    color: var(--red);
  }
`;

interface Props {
  question: Question;
  onEdit: (question: Question) => void;
  onDelete: (id: string) => void;
  onClick: (question: Question) => void;
}

export const QuestionCard = ({ question, onEdit, onDelete, onClick }: Props) => {
  const preview = question.text.length > 100
    ? question.text.substring(0, 100) + '...'
    : question.text;

  return (
    <Card onClick={() => onClick(question)}>
      <Header>
        <DifficultyBadge difficulty={question.difficulty} />
        <Actions onClick={(e) => e.stopPropagation()}>
          <ActionBtn onClick={() => onEdit(question)}>Edit</ActionBtn>
          <DeleteBtn onClick={() => onDelete(question.id)}>Delete</DeleteBtn>
        </Actions>
      </Header>
      <QuestionText>{preview}</QuestionText>
      {question.tags.length > 0 && (
        <Tags>
          {question.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
        </Tags>
      )}
    </Card>
  );
};
