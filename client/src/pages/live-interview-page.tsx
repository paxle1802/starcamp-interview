import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { interviewService } from '../services/interview-service';
import { scoreService } from '../services/score-service';
import type { Interview, InterviewQuestionItem } from '../types/interview';
import type { Score } from '../types/score';
import { SectionTimer } from '../components/section-timer';
import { ScoringPanel } from '../components/scoring-panel';
import { useAutoSave } from '../hooks/use-auto-save';

const Container = styled.div`
  max-width: 1300px;
  margin: 0 auto;
  padding: 24px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
`;

const PageTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.4px;
  color: var(--text-primary);
`;

const SectionBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  padding: 14px 20px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
`;

const SectionBadge = styled.span`
  padding: 4px 12px;
  background: var(--accent);
  color: white;
  border-radius: 980px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.3px;
  text-transform: uppercase;
  white-space: nowrap;
`;

const SectionTitle = styled.span`
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
`;

const SectionMeta = styled.span`
  font-size: 13px;
  color: var(--text-tertiary);
  margin-left: auto;
`;

const QuestionProgress = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
`;

const ProgressDot = styled.button<{ $state: 'done' | 'active' | 'pending' }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid ${({ $state }) =>
    $state === 'done' ? 'var(--green)' :
      $state === 'active' ? 'var(--accent)' : 'var(--border)'};
  background: ${({ $state }) =>
    $state === 'done' ? 'var(--green)' :
      $state === 'active' ? 'var(--accent)' : 'var(--bg-secondary)'};
  color: ${({ $state }) =>
    $state === 'done' || $state === 'active' ? 'white' : 'var(--text-tertiary)'};
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all var(--transition);
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  }
`;

const ProgressLine = styled.div<{ $done: boolean }>`
  width: 20px;
  height: 2px;
  background: ${({ $done }) => $done ? 'var(--green)' : 'var(--border)'};
  border-radius: 1px;
  transition: background var(--transition);
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
`;

const Panel = styled.div`
  padding: 24px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
`;

const PanelTitle = styled.h2`
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 14px;
`;

const PanelContent = styled.p`
  white-space: pre-wrap;
  line-height: 1.7;
  font-size: 14px;
  color: var(--text-primary);
  margin: 0;
`;

const AnswerPanel = styled(Panel)`
  background: var(--bg-tertiary);
  border-left: 3px solid var(--accent);
`;

const Navigation = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
`;

const PrevBtn = styled.button`
  padding: 11px 24px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  background: var(--bg-secondary);
  border: 2px solid var(--accent);
  color: var(--accent);
  transition: all var(--transition);
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover:not(:disabled) {
    background: var(--accent);
    color: white;
    transform: translateX(-2px);
  }
  &:disabled { opacity: 0.3; cursor: not-allowed; border-color: var(--border); color: var(--text-tertiary); }
`;

const NextBtn = styled.button`
  padding: 11px 24px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  background: var(--accent);
  color: white;
  border: 2px solid var(--accent);
  transition: all var(--transition);
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover:not(:disabled) {
    background: var(--accent-hover);
    border-color: var(--accent-hover);
    transform: translateX(2px);
  }
  &:disabled { opacity: 0.3; cursor: not-allowed; }
`;

const NextSectionBtn = styled.button`
  padding: 11px 24px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 700;
  font-size: 14px;
  background: var(--green);
  color: white;
  border: 2px solid var(--green);
  transition: all var(--transition);
  display: flex;
  align-items: center;
  gap: 6px;

  &:hover:not(:disabled) { background: #2db84d; border-color: #2db84d; transform: scale(1.02); }
  &:active { transform: scale(0.98); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const QuestionCounter = styled.span`
  font-size: 14px;
  color: var(--text-primary);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  padding: 6px 16px;
  background: var(--bg-tertiary);
  border-radius: 980px;
`;

const SaveStatus = styled.p<{ $visible: boolean }>`
  text-align: center;
  color: var(--text-tertiary);
  font-size: 12px;
  opacity: ${({ $visible }) => ($visible ? 1 : 0)};
  transition: opacity 0.3s;
`;

const EndEarlyBtn = styled.button`
  padding: 8px 18px;
  background: var(--bg-secondary);
  color: var(--red);
  border: 1px solid var(--red);
  border-radius: 980px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all var(--transition);

  &:hover { background: var(--red); color: white; }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const ConfirmBar = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--orange-light);
  padding: 8px 14px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-primary);
`;

const ConfirmYes = styled.button`
  padding: 6px 14px;
  background: var(--red);
  color: white;
  border: none;
  border-radius: 980px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  transition: all var(--transition);
  &:hover { opacity: 0.9; }
`;

const ConfirmCancel = styled.button`
  padding: 6px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: 980px;
  cursor: pointer;
  font-size: 12px;
  color: var(--text-secondary);
  transition: all var(--transition);
  &:hover { background: var(--bg-tertiary); }
`;

export const LiveInterviewPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [sectionStartTime, setSectionStartTime] = useState(new Date());
  const [scores, setScores] = useState<Record<string, { score: number; notes: string }>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const interviewStartRef = useRef<Date>(new Date());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    const tick = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - interviewStartRef.current.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const formatElapsed = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!id) return;
    loadInterview();
  }, [id]);

  const loadInterview = async () => {
    if (!id) return;
    try {
      const data = await interviewService.getById(id);
      setInterview(data);

      if (data.status === 'SETUP') {
        await interviewService.start(id);
      }

      const existingScores = await scoreService.listByInterview(id);
      const scoreMap: Record<string, { score: number; notes: string }> = {};
      existingScores.forEach((s: Score) => {
        scoreMap[s.questionId] = { score: s.score, notes: s.notes || '' };
      });
      setScores(scoreMap);
    } catch (err) {
      console.error('Failed to load interview:', err);
      setError('Failed to load interview. It may not exist or you may not have access.');
      navigate('/interviews');
    } finally {
      setLoading(false);
    }
  };

  const saveScores = useCallback(async () => {
    if (!id || Object.keys(scores).length === 0) return;
    setSaving(true);
    try {
      const promises = Object.entries(scores)
        .filter(([, data]) => data.score > 0)
        .map(([questionId, data]) =>
          scoreService.upsert({
            interviewId: id,
            questionId,
            score: data.score,
            notes: data.notes,
          })
        );
      await Promise.all(promises);
    } catch (error) {
      console.error('Auto-save error:', error);
    } finally {
      setSaving(false);
    }
  }, [id, scores]);

  useAutoSave(saveScores, 30000);

  if (loading) return <Container><p style={{ color: 'var(--text-tertiary)', padding: 40 }}>Loading interview...</p></Container>;
  if (error) return <Container><p style={{ color: 'var(--red)', padding: 40 }}>{error}</p></Container>;
  if (!interview || !interview.selectedQuestions) {
    return <Container><p style={{ color: 'var(--text-tertiary)', padding: 40 }}>Interview not found or no questions selected.</p></Container>;
  }

  const currentSection = interview.sectionConfigs[currentSectionIdx];
  const questionsInSection = interview.selectedQuestions.filter(
    (q) => q.question.sectionId === currentSection.sectionId
  );
  const currentQuestion: InterviewQuestionItem | undefined = questionsInSection[currentQuestionIdx];

  const handleNextQuestion = () => {
    if (currentQuestionIdx < questionsInSection.length - 1) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(currentQuestionIdx - 1);
    }
  };

  const handleNextSection = async () => {
    await saveScores();
    if (currentSectionIdx < interview.sectionConfigs.length - 1) {
      setCurrentSectionIdx(currentSectionIdx + 1);
      setCurrentQuestionIdx(0);
      setSectionStartTime(new Date());
    } else {
      if (id) {
        await interviewService.complete(id);
        navigate(`/interviews/${id}/results`);
      }
    }
  };

  const handleEndEarly = async () => {
    await saveScores();
    if (id) {
      await interviewService.complete(id);
      navigate(`/interviews/${id}/results`);
    }
  };

  const updateScore = (questionId: string, score: number) => {
    setScores(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], score, notes: prev[questionId]?.notes || '' },
    }));
  };

  const updateNotes = (questionId: string, notes: string) => {
    setScores(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], notes, score: prev[questionId]?.score || 0 },
    }));
  };

  const isQuestionScored = (idx: number) => {
    const q = questionsInSection[idx];
    return q && scores[q.questionId]?.score > 0;
  };

  return (
    <Container>
      <Header>
        <PageTitle>{interview.candidateName}</PageTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)', fontSize: 13 }}>
          <span>⏱</span>
          <span style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {formatElapsed(elapsedSeconds)}
          </span>
          <span style={{ color: 'var(--text-tertiary)' }}>elapsed</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <SaveStatus $visible={saving}>Saving...</SaveStatus>
          {!showEndConfirm ? (
            <EndEarlyBtn onClick={() => setShowEndConfirm(true)}>End Interview</EndEarlyBtn>
          ) : (
            <ConfirmBar>
              <span>End interview early?</span>
              <ConfirmYes onClick={handleEndEarly}>Yes, end now</ConfirmYes>
              <ConfirmCancel onClick={() => setShowEndConfirm(false)}>Cancel</ConfirmCancel>
            </ConfirmBar>
          )}
        </div>
      </Header>

      <SectionBar>
        <SectionBadge>
          Section {currentSectionIdx + 1}/{interview.sectionConfigs.length}
        </SectionBadge>
        <SectionTitle>{currentSection.section.name}</SectionTitle>
        <SectionMeta>
          {questionsInSection.length} questions &middot; {currentSection.durationMinutes} min
        </SectionMeta>
      </SectionBar>

      <SectionTimer startTime={sectionStartTime} durationMinutes={currentSection.durationMinutes} />

      {questionsInSection.length > 0 && (
        <QuestionProgress>
          {questionsInSection.map((_, idx) => (
            <span key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <ProgressDot
                $state={idx === currentQuestionIdx ? 'active' : isQuestionScored(idx) ? 'done' : 'pending'}
                onClick={() => setCurrentQuestionIdx(idx)}
                title={`Question ${idx + 1}`}
              >
                {isQuestionScored(idx) && idx !== currentQuestionIdx ? '✓' : idx + 1}
              </ProgressDot>
              {idx < questionsInSection.length - 1 && (
                <ProgressLine $done={isQuestionScored(idx)} />
              )}
            </span>
          ))}
        </QuestionProgress>
      )}

      {currentQuestion ? (
        <>
          <Grid>
            <Panel>
              <PanelTitle>Question</PanelTitle>
              <PanelContent>{currentQuestion.question.text}</PanelContent>
            </Panel>

            <AnswerPanel>
              <PanelTitle>Answer Key</PanelTitle>
              <PanelContent>{currentQuestion.question.answer}</PanelContent>
            </AnswerPanel>
          </Grid>

          <ScoringPanel
            score={scores[currentQuestion.questionId]?.score}
            notes={scores[currentQuestion.questionId]?.notes}
            onScoreChange={(score) => updateScore(currentQuestion.questionId, score)}
            onNotesChange={(notes) => updateNotes(currentQuestion.questionId, notes)}
          />
        </>
      ) : (
        <Panel>
          <p style={{ color: 'var(--text-tertiary)' }}>No questions selected for this section.</p>
        </Panel>
      )}

      <Navigation>
        <PrevBtn onClick={handlePrevQuestion} disabled={currentQuestionIdx === 0}>
          ← Previous
        </PrevBtn>
        <QuestionCounter>
          Question {currentQuestionIdx + 1} of {questionsInSection.length}
        </QuestionCounter>
        {currentQuestionIdx < questionsInSection.length - 1 ? (
          <NextBtn onClick={handleNextQuestion}>
            Next →
          </NextBtn>
        ) : (
          <NextSectionBtn onClick={handleNextSection}>
            {currentSectionIdx < interview.sectionConfigs.length - 1
              ? 'Next Section →'
              : '✓ Complete Interview'}
          </NextSectionBtn>
        )}
      </Navigation>
    </Container>
  );
};
