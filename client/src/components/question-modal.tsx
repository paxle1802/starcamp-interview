import { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import type { Question, CreateQuestionDTO, Difficulty } from '../types/question';
import type { Section } from '../types/section';

const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  animation: ${fadeIn} 0.2s ease-out;
`;

const ModalBox = styled.div`
  background: var(--bg-secondary);
  padding: 32px;
  border-radius: var(--radius-xl);
  width: 580px;
  max-height: 85vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
  animation: ${slideUp} 0.3s ease-out;
`;

const ModalTitle = styled.h2`
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.3px;
  margin: 0 0 24px;
  color: var(--text-primary);
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const FieldGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const Label = styled.label`
  font-weight: 500;
  font-size: 13px;
  color: var(--text-secondary);
`;

const Input = styled.input`
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  outline: none;
  transition: all var(--transition);

  &:focus {
    border-color: var(--border-focused);
    background: var(--bg-secondary);
    box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.12);
  }

  &::placeholder { color: var(--text-tertiary); }
`;

const Textarea = styled.textarea`
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  min-height: 100px;
  resize: vertical;
  font-family: inherit;
  outline: none;
  transition: all var(--transition);

  &:focus {
    border-color: var(--border-focused);
    background: var(--bg-secondary);
    box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.12);
  }

  &::placeholder { color: var(--text-tertiary); }
`;

const Select = styled.select`
  padding: 10px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  outline: none;
  cursor: pointer;
  transition: all var(--transition);

  &:focus {
    border-color: var(--border-focused);
    box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.12);
  }
`;

const Actions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 8px;
`;

const SaveBtn = styled.button`
  padding: 10px 24px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  background: var(--accent);
  color: white;
  border: none;
  transition: all var(--transition);

  &:hover { background: var(--accent-hover); transform: scale(1.01); }
  &:active { transform: scale(0.99); }
  &:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
`;

const CancelBtn = styled.button`
  padding: 10px 24px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  transition: all var(--transition);

  &:hover { background: var(--bg-primary); color: var(--text-primary); }
`;

const ErrorMsg = styled.p`
  color: var(--red);
  font-size: 13px;
  margin: 0;
  padding: 10px 14px;
  background: var(--red-light);
  border-radius: var(--radius-sm);
`;

interface Props {
  question?: Question;
  sections: Section[];
  onSave: (data: CreateQuestionDTO) => Promise<void>;
  onClose: () => void;
}

export const QuestionModal = ({ question, sections, onSave, onClose }: Props) => {
  const [formData, setFormData] = useState({
    sectionId: question?.sectionId || '',
    text: question?.text || '',
    answer: question?.answer || '',
    difficulty: (question?.difficulty || 'MEDIUM') as Difficulty,
    tags: question?.tags.join(', ') || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      onClose();
    } catch {
      setError('Failed to save question. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Overlay onClick={onClose}>
      <ModalBox onClick={(e) => e.stopPropagation()}>
        <ModalTitle>{question ? 'Edit Question' : 'New Question'}</ModalTitle>
        <Form onSubmit={handleSubmit}>
          <FieldGroup>
            <Label>Section</Label>
            <Select
              value={formData.sectionId}
              onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
              required
            >
              <option value="">Select section</option>
              {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </FieldGroup>

          <FieldGroup>
            <Label>Question Text</Label>
            <Textarea
              value={formData.text}
              onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              required
              placeholder="Enter the interview question..."
            />
          </FieldGroup>

          <FieldGroup>
            <Label>Answer / Expected Response</Label>
            <Textarea
              value={formData.answer}
              onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
              required
              placeholder="Enter the expected answer or key points..."
            />
          </FieldGroup>

          <FieldGroup>
            <Label>Difficulty</Label>
            <Select
              value={formData.difficulty}
              onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as Difficulty })}
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </Select>
          </FieldGroup>

          <FieldGroup>
            <Label>Tags (comma-separated)</Label>
            <Input
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="react, typescript, frontend"
            />
          </FieldGroup>

          {error && <ErrorMsg>{error}</ErrorMsg>}

          <Actions>
            <CancelBtn type="button" onClick={onClose}>Cancel</CancelBtn>
            <SaveBtn type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </SaveBtn>
          </Actions>
        </Form>
      </ModalBox>
    </Overlay>
  );
};
