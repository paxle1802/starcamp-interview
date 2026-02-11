import { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { questionService } from '../services/question-service';
import { sectionService } from '../services/section-service';
import type { Question, Difficulty, CreateQuestionDTO } from '../types/question';
import type { Section } from '../types/section';
import { SectionTabs } from '../components/section-tabs';
import { FilterBar } from '../components/filter-bar';
import { QuestionCard } from '../components/question-card';
import { QuestionModal } from '../components/question-modal';

const Container = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: 32px 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 28px;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--text-primary);
`;

const CreateBtn = styled.button`
  padding: 9px 20px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: 980px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all var(--transition);

  &:hover { background: var(--accent-hover); transform: scale(1.02); }
  &:active { transform: scale(0.98); }
`;

const EmptyState = styled.div`
  text-align: center;
  color: var(--text-tertiary);
  padding: 60px 20px;
  font-size: 15px;
`;

const DetailOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const DetailCard = styled.div`
  background: var(--bg-secondary);
  padding: 32px;
  border-radius: var(--radius-xl);
  width: 680px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: var(--shadow-xl);
`;

const DetailTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.3px;
  margin: 0 0 8px;
  color: var(--text-primary);
`;

const DetailMeta = styled.p`
  color: var(--text-tertiary);
  font-size: 13px;
  margin: 0;
`;

const AnswerBlock = styled.div`
  background: var(--bg-tertiary);
  padding: 20px;
  border-radius: var(--radius-md);
  margin-top: 20px;
  border-left: 3px solid var(--accent);
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.7;
  color: var(--text-primary);
`;

const CloseBtn = styled.button`
  margin-top: 20px;
  padding: 9px 20px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all var(--transition);

  &:hover { background: var(--bg-primary); color: var(--text-primary); }
`;

const ConfirmOverlay = styled(DetailOverlay)``;

const ConfirmBox = styled.div`
  background: var(--bg-secondary);
  padding: 28px 32px;
  border-radius: var(--radius-xl);
  width: 400px;
  text-align: center;
  box-shadow: var(--shadow-xl);
`;

const ConfirmTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px;
`;

const ConfirmDesc = styled.p`
  font-size: 14px;
  color: var(--text-tertiary);
  margin: 0 0 24px;
  line-height: 1.5;
`;

const ConfirmActions = styled.div`
  display: flex;
  gap: 10px;
  justify-content: center;
`;

const ConfirmDeleteBtn = styled.button`
  padding: 10px 24px;
  background: var(--red);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  transition: all var(--transition);

  &:hover { opacity: 0.9; transform: scale(1.01); }
  &:active { transform: scale(0.99); }
`;

const ConfirmCancelBtn = styled.button`
  padding: 10px 24px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all var(--transition);

  &:hover { background: var(--bg-primary); color: var(--text-primary); }
`;

export const QuestionBankPage = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty | 'ALL'>('ALL');
  const [tags, setTags] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | undefined>();
  const [viewingQuestion, setViewingQuestion] = useState<Question | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    sectionService.list().then(setSections);
  }, []);

  const loadQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {};
      if (activeSection) params.sectionId = activeSection;
      if (difficulty !== 'ALL') params.difficulty = difficulty;
      if (tags) params.tags = tags;

      const { questions } = await questionService.list(params);
      setQuestions(questions);
    } catch {
      console.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [activeSection, difficulty, tags]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const handleCreate = () => {
    setEditingQuestion(undefined);
    setShowModal(true);
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    setShowModal(true);
  };

  const handleSave = async (data: CreateQuestionDTO) => {
    if (editingQuestion) {
      await questionService.update(editingQuestion.id, data);
    } else {
      await questionService.create(data);
    }
    loadQuestions();
  };

  const handleDelete = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    await questionService.delete(deletingId);
    setDeletingId(null);
    loadQuestions();
  };

  return (
    <Container>
      <Header>
        <PageTitle>Question Bank</PageTitle>
        <CreateBtn onClick={handleCreate}>+ New Question</CreateBtn>
      </Header>

      <SectionTabs
        sections={sections}
        activeSection={activeSection}
        onChange={setActiveSection}
      />

      <FilterBar
        difficulty={difficulty}
        tags={tags}
        onDifficultyChange={setDifficulty}
        onTagsChange={setTags}
      />

      {loading ? (
        <EmptyState>Loading...</EmptyState>
      ) : questions.length === 0 ? (
        <EmptyState>No questions found. Create one to get started!</EmptyState>
      ) : (
        questions.map(q => (
          <QuestionCard
            key={q.id}
            question={q}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onClick={setViewingQuestion}
          />
        ))
      )}

      {showModal && (
        <QuestionModal
          question={editingQuestion}
          sections={sections}
          onSave={handleSave}
          onClose={() => setShowModal(false)}
        />
      )}

      {viewingQuestion && (
        <DetailOverlay onClick={() => setViewingQuestion(null)}>
          <DetailCard onClick={(e) => e.stopPropagation()}>
            <DetailTitle>{viewingQuestion.text}</DetailTitle>
            <DetailMeta>
              Section: {viewingQuestion.section?.name} &middot; Difficulty: {viewingQuestion.difficulty}
            </DetailMeta>
            <AnswerBlock>
              <strong>Answer:</strong>
              <br />{viewingQuestion.answer}
            </AnswerBlock>
            <CloseBtn onClick={() => setViewingQuestion(null)}>Close</CloseBtn>
          </DetailCard>
        </DetailOverlay>
      )}
      {deletingId && (
        <ConfirmOverlay onClick={() => setDeletingId(null)}>
          <ConfirmBox onClick={(e) => e.stopPropagation()}>
            <ConfirmTitle>Delete Question</ConfirmTitle>
            <ConfirmDesc>
              Are you sure you want to delete this question? This action cannot be undone.
            </ConfirmDesc>
            <ConfirmActions>
              <ConfirmCancelBtn onClick={() => setDeletingId(null)}>Cancel</ConfirmCancelBtn>
              <ConfirmDeleteBtn onClick={confirmDelete}>Delete</ConfirmDeleteBtn>
            </ConfirmActions>
          </ConfirmBox>
        </ConfirmOverlay>
      )}
    </Container>
  );
};
