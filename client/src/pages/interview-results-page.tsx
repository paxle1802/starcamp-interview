import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { interviewService } from '../services/interview-service';
import { scoreService } from '../services/score-service';
import type { Interview } from '../types/interview';
import type { Score } from '../types/score';

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

const OverallScore = styled.div`
  text-align: center;
  padding: 32px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  margin-bottom: 24px;
`;

const ScoreLabel = styled.p`
  color: var(--text-tertiary);
  font-size: 13px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 8px;
`;

const BigScore = styled.div`
  font-size: 56px;
  font-weight: 700;
  letter-spacing: -2px;
  color: var(--accent);
`;

const ScoreCount = styled.p`
  color: var(--text-tertiary);
  font-size: 14px;
  margin: 4px 0 0;
`;

const SectionCard = styled.div`
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 20px 24px;
  margin-bottom: 14px;
  background: var(--bg-secondary);
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
`;

const SectionName = styled.h2`
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
`;

const SectionScore = styled.span`
  font-size: 20px;
  font-weight: 700;
  color: var(--accent);
`;

const QuestionRow = styled.div`
  padding: 12px 0;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
`;

const QuestionText = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
`;

const NoteText = styled.p`
  color: var(--text-tertiary);
  font-size: 12px;
  margin: 4px 0 0;
`;

const ScoreBadge = styled.span<{ $score: number }>`
  padding: 4px 14px;
  border-radius: 980px;
  font-weight: 600;
  font-size: 12px;
  white-space: nowrap;
  background: ${({ $score }) =>
    $score >= 4 ? 'var(--green-light)' :
      $score === 3 ? 'var(--orange-light)' : 'var(--red-light)'};
  color: ${({ $score }) =>
    $score >= 4 ? 'var(--green)' :
      $score === 3 ? 'var(--orange)' : 'var(--red)'};
`;

const SCORE_LABELS: Record<number, string> = {
  1: 'Poor', 2: 'Needs Work', 3: 'Average', 4: 'Good', 5: 'Excellent',
};

const ExportActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ExportBtn = styled.button`
  padding: 8px 18px;
  border: 1px solid var(--accent);
  color: var(--accent);
  background: var(--bg-secondary);
  border-radius: 980px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all var(--transition);

  &:hover { background: var(--accent); color: white; }
`;

const BackBtn = styled(ExportBtn)`
  border-color: var(--border);
  color: var(--text-secondary);

  &:hover {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }
`;

export const InterviewResultsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      interviewService.getById(id),
      scoreService.listByInterview(id),
    ]).then(([interviewData, scoresData]) => {
      setInterview(interviewData);
      setScores(scoresData);
    }).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Container><p style={{ color: 'var(--text-tertiary)', padding: 40 }}>Loading results...</p></Container>;
  if (!interview) return <Container><p style={{ color: 'var(--text-tertiary)', padding: 40 }}>Interview not found.</p></Container>;

  const scoreMap = new Map(scores.map(s => [s.questionId, s]));

  const sectionGroups = interview.sectionConfigs?.map(sc => {
    const sectionQuestions = interview.selectedQuestions?.filter(
      q => q.question.sectionId === sc.sectionId
    ) || [];
    const sectionScores = sectionQuestions
      .map(q => scoreMap.get(q.questionId))
      .filter((s): s is Score => !!s);
    const sectionAvg = sectionScores.length > 0
      ? (sectionScores.reduce((sum, s) => sum + s.score, 0) / sectionScores.length).toFixed(1)
      : '\u2014';

    return { section: sc.section, questions: sectionQuestions, scores: sectionScores, avg: sectionAvg };
  }) || [];

  // Overall = average of section averages (not flat average of all questions)
  const scoredSections = sectionGroups.filter(g => g.avg !== '\u2014');
  const avgScore = scoredSections.length > 0
    ? (scoredSections.reduce((sum, g) => sum + parseFloat(g.avg), 0) / scoredSections.length).toFixed(1)
    : '\u2014';

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const handleExportPdf = () => {
    window.open(`${API_BASE}/api/interviews/${id}/export/pdf`, '_blank');
  };

  const handleExportExcel = () => {
    window.open(`${API_BASE}/api/interviews/${id}/export/excel`, '_blank');
  };

  return (
    <Container>
      <Header>
        <PageTitle>Results: {interview.candidateName}</PageTitle>
        <ExportActions>
          <ExportBtn onClick={handleExportPdf}>Export PDF</ExportBtn>
          <ExportBtn onClick={handleExportExcel}>Export Excel</ExportBtn>
          <BackBtn onClick={() => navigate('/interviews')}>Back to List</BackBtn>
        </ExportActions>
      </Header>

      <OverallScore>
        <ScoreLabel>Overall Average Score</ScoreLabel>
        <BigScore>{avgScore}</BigScore>
        <ScoreCount>{scores.length} questions scored</ScoreCount>
      </OverallScore>

      {sectionGroups.map(group => (
        <SectionCard key={group.section.id}>
          <SectionHeader>
            <SectionName>{group.section.name}</SectionName>
            <SectionScore>{group.avg} / 5</SectionScore>
          </SectionHeader>
          {group.questions.map(q => {
            const s = scoreMap.get(q.questionId);
            return (
              <QuestionRow key={q.id}>
                <div style={{ flex: 1 }}>
                  <QuestionText>{q.question.text}</QuestionText>
                  {s?.notes && <NoteText>Note: {s.notes}</NoteText>}
                </div>
                <div style={{ marginLeft: 16 }}>
                  {s ? (
                    <ScoreBadge $score={s.score}>{s.score} &mdash; {SCORE_LABELS[s.score]}</ScoreBadge>
                  ) : (
                    <ScoreBadge $score={0}>Not scored</ScoreBadge>
                  )}
                </div>
              </QuestionRow>
            );
          })}
        </SectionCard>
      ))}
    </Container>
  );
};
