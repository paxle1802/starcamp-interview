import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { interviewService } from '../services/interview-service';
import type { Interview } from '../types/interview';

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

const Card = styled.div`
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 18px 22px;
  margin-bottom: 10px;
  background: var(--bg-secondary);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all var(--transition);

  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }
`;

const CandidateName = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
`;

const Meta = styled.p`
  color: var(--text-tertiary);
  font-size: 13px;
  margin: 4px 0 0;
`;

const ScorePill = styled.span<{ $score: number }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 980px;
  font-size: 13px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  background: ${({ $score }) =>
    $score >= 4 ? 'var(--green-light)' :
    $score >= 3 ? 'var(--orange-light)' : 'var(--red-light)'};
  color: ${({ $score }) =>
    $score >= 4 ? 'var(--green)' :
    $score >= 3 ? 'var(--orange)' : 'var(--red)'};
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 4px 12px;
  border-radius: 980px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  background: ${({ $status }) =>
    $status === 'SETUP' ? 'var(--orange-light)' :
    $status === 'IN_PROGRESS' ? 'var(--accent-light)' :
    $status === 'COMPLETED' ? 'var(--green-light)' : 'var(--red-light)'};
  color: ${({ $status }) =>
    $status === 'SETUP' ? 'var(--orange)' :
    $status === 'IN_PROGRESS' ? 'var(--accent)' :
    $status === 'COMPLETED' ? 'var(--green)' : 'var(--red)'};
`;

const ActionBtn = styled.button`
  padding: 6px 16px;
  border: 1px solid var(--accent);
  color: var(--accent);
  background: var(--bg-secondary);
  border-radius: 980px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  margin-left: 10px;
  transition: all var(--transition);

  &:hover {
    background: var(--accent);
    color: white;
  }
`;

const DeleteBtn = styled.button`
  padding: 6px 16px;
  border: 1px solid var(--red);
  color: var(--red);
  background: var(--bg-secondary);
  border-radius: 980px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  margin-left: 6px;
  transition: all var(--transition);

  &:hover {
    background: var(--red);
    color: white;
  }
`;

const EmptyState = styled.p`
  color: var(--text-tertiary);
  text-align: center;
  padding: 60px 20px;
  font-size: 15px;
`;

const ConfirmOverlay = styled.div`
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

export const InterviewListPage = () => {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadInterviews = () => {
    interviewService.list()
      .then(setInterviews)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInterviews();
  }, []);

  const confirmDelete = async () => {
    if (!deletingId) return;
    await interviewService.delete(deletingId);
    setDeletingId(null);
    loadInterviews();
  };

  // Compute section-weighted overall average for an interview
  const getOverallScore = (interview: Interview): number | null => {
    if (!interview.scores?.length || !interview.sectionConfigs?.length || !interview.selectedQuestions?.length) return null;
    const scoreMap = new Map(interview.scores.map(s => [s.questionId, s.score]));
    const sectionAvgs: number[] = [];
    for (const sc of interview.sectionConfigs) {
      const sectionScores = interview.selectedQuestions
        .filter(q => q.question?.sectionId === sc.sectionId)
        .map(q => scoreMap.get(q.questionId))
        .filter((s): s is number => s !== undefined && s > 0);
      if (sectionScores.length > 0) {
        sectionAvgs.push(sectionScores.reduce((a, b) => a + b, 0) / sectionScores.length);
      }
    }
    return sectionAvgs.length > 0
      ? sectionAvgs.reduce((a, b) => a + b, 0) / sectionAvgs.length
      : null;
  };

  return (
    <Container>
      <Header>
        <PageTitle>Interviews</PageTitle>
        <CreateBtn onClick={() => navigate('/interviews/new')}>+ New Interview</CreateBtn>
      </Header>

      {loading ? (
        <EmptyState>Loading...</EmptyState>
      ) : interviews.length === 0 ? (
        <EmptyState>No interviews yet. Create one to get started!</EmptyState>
      ) : (
        interviews.map(interview => (
          <Card key={interview.id}>
            <div>
              <CandidateName>{interview.candidateName}</CandidateName>
              <Meta>
                {new Date(interview.date).toLocaleDateString()} &middot;{' '}
                {interview.sectionConfigs?.reduce((sum, sc) => sum + sc.durationMinutes, 0)} min total
              </Meta>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {(() => {
                const score = getOverallScore(interview);
                return score !== null ? (
                  <ScorePill $score={score}>{score.toFixed(1)} / 5</ScorePill>
                ) : null;
              })()}
              <StatusBadge $status={interview.status}>{interview.status}</StatusBadge>
              {interview.status === 'SETUP' && (
                <ActionBtn onClick={() => navigate(`/interviews/${interview.id}/live`)}>
                  Start
                </ActionBtn>
              )}
              {interview.status === 'IN_PROGRESS' && (
                <ActionBtn onClick={() => navigate(`/interviews/${interview.id}/live`)}>
                  Resume
                </ActionBtn>
              )}
              {interview.status === 'COMPLETED' && (
                <ActionBtn onClick={() => navigate(`/interviews/${interview.id}/results`)}>
                  Results
                </ActionBtn>
              )}
              <DeleteBtn onClick={() => setDeletingId(interview.id)}>Delete</DeleteBtn>
            </div>
          </Card>
        ))
      )}

      {deletingId && (
        <ConfirmOverlay onClick={() => setDeletingId(null)}>
          <ConfirmBox onClick={(e) => e.stopPropagation()}>
            <ConfirmTitle>Delete Interview</ConfirmTitle>
            <ConfirmDesc>
              Are you sure you want to delete this interview? All scores and data will be permanently removed.
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
