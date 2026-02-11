import { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { interviewService } from '../services/interview-service';
import { sectionService } from '../services/section-service';
import { questionService } from '../services/question-service';
import type { Section } from '../types/section';
import type { Question } from '../types/question';
import { StepIndicator } from '../components/step-indicator';
import { DifficultyBadge } from '../components/difficulty-badge';

const Container = styled.div`
  max-width: 860px;
  margin: 0 auto;
  padding: 32px 24px;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--text-primary);
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  font-size: 15px;
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

const SectionGroup = styled.div`
  margin-bottom: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 18px 20px;
  background: var(--bg-secondary);
`;

const SectionName = styled.h3`
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
`;

const SectionDesc = styled.p`
  color: var(--text-tertiary);
  font-size: 13px;
  margin: 0 0 12px;
`;

const QuestionItem = styled.label`
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background var(--transition);

  &:hover { background: var(--bg-tertiary); }

  input {
    margin-top: 3px;
    accent-color: var(--accent);
  }
`;

const TimeRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TimeInput = styled.input`
  width: 70px;
  padding: 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  text-align: center;
  font-size: 14px;
  color: var(--text-primary);
  background: var(--bg-tertiary);
  outline: none;
  transition: all var(--transition);

  &:focus {
    border-color: var(--border-focused);
    box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.12);
  }
`;

const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 32px;
`;

const BackBtn = styled.button`
  padding: 10px 24px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  color: var(--text-secondary);
  transition: all var(--transition);

  &:hover { background: var(--bg-primary); color: var(--text-primary); }
`;

const NextBtn = styled.button`
  padding: 10px 24px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  background: var(--accent);
  color: white;
  border: none;
  transition: all var(--transition);

  &:hover { background: var(--accent-hover); }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`;

const SaveBtn = styled(NextBtn)`
  background: var(--green);
  &:hover { background: #2db84d; }
`;

const ErrorMsg = styled.div`
  background: var(--red-light);
  color: var(--red);
  border-radius: var(--radius-sm);
  padding: 12px 16px;
  margin-top: 16px;
  font-size: 14px;
`;

const EmptyWarning = styled.div`
  background: var(--orange-light);
  border-radius: var(--radius-md);
  padding: 28px;
  text-align: center;
`;

const SelectedCount = styled.p`
  color: var(--text-tertiary);
  font-size: 13px;
  margin-bottom: 16px;
`;

const RandomBtn = styled.button`
  padding: 8px 18px;
  background: var(--bg-secondary);
  color: var(--accent);
  border: 1.5px solid var(--accent);
  border-radius: 980px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all var(--transition);
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:hover { background: var(--accent); color: white; transform: scale(1.02); }
  &:active { transform: scale(0.98); }
`;

const SelectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const TotalTime = styled.p`
  color: var(--text-tertiary);
  font-size: 13px;
  margin-bottom: 16px;
`;

const STEPS = ['Candidate Info', 'Select Questions', 'Configure Time'];

export const InterviewSetupPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [candidateName, setCandidateName] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [questionsBySection, setQuestionsBySection] = useState<Record<string, Question[]>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sectionTimes, setSectionTimes] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    sectionService.list().then(data => {
      setSections(data);
      const times: Record<string, number> = {};
      data.forEach(s => (times[s.id] = s.defaultDuration));
      setSectionTimes(times);
    });
  }, []);

  useEffect(() => {
    if (sections.length > 0 && step === 1) {
      questionService.list({}).then(({ questions }) => {
        const bySection: Record<string, Question[]> = {};
        questions.forEach(q => {
          if (!bySection[q.sectionId]) bySection[q.sectionId] = [];
          bySection[q.sectionId].push(q);
        });
        setQuestionsBySection(bySection);
      });
    }
  }, [sections, step]);

  const toggleQuestion = (id: string) => {
    const updated = new Set(selectedIds);
    updated.has(id) ? updated.delete(id) : updated.add(id);
    setSelectedIds(updated);
  };

  const randomSelect = () => {
    const newSelected = new Set<string>();
    sections.forEach(section => {
      const sectionQs = questionsBySection[section.id] || [];
      if (sectionQs.length === 0) return;
      const count = Math.max(1, Math.min(3, Math.ceil(sectionQs.length * 0.4)));
      const shuffled = [...sectionQs].sort(() => Math.random() - 0.5);
      shuffled.slice(0, count).forEach(q => newSelected.add(q.id));
    });
    setSelectedIds(newSelected);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const sectionConfigs = sections.map(s => ({
        sectionId: s.id,
        durationMinutes: sectionTimes[s.id],
      }));

      const selectedQuestions = Array.from(selectedIds).map((id, idx) => ({
        questionId: id,
        order: idx + 1,
      }));

      const interview = await interviewService.create({
        candidateName,
        sectionConfigs,
        selectedQuestions,
      });

      navigate(`/interviews/${interview.id}/live`);
    } catch {
      setError('Failed to create interview. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container>
      <PageTitle>Setup Interview</PageTitle>
      <StepIndicator currentStep={step} steps={STEPS} />

      {step === 0 && (
        <div>
          <SectionName style={{ marginBottom: 12 }}>Candidate Name</SectionName>
          <Input
            placeholder="Enter candidate's full name"
            value={candidateName}
            onChange={(e) => setCandidateName(e.target.value)}
            autoFocus
          />
        </div>
      )}

      {step === 1 && (
        <div>
          <SectionName style={{ marginBottom: 16, fontSize: 18 }}>Select Questions</SectionName>
          {Object.keys(questionsBySection).length === 0 ? (
            <EmptyWarning>
              <p style={{ fontWeight: 600, marginBottom: 8, color: 'var(--orange)' }}>
                No questions in the question bank yet
              </p>
              <p style={{ color: 'var(--text-tertiary)', marginBottom: 16, fontSize: 14 }}>
                You need to add questions before creating an interview.
              </p>
              <NextBtn onClick={() => navigate('/questions')}>Go to Question Bank</NextBtn>
            </EmptyWarning>
          ) : (
            <>
              <SelectionHeader>
                <SelectedCount style={{ margin: 0 }}>{selectedIds.size} question(s) selected</SelectedCount>
                <RandomBtn onClick={randomSelect}>🎲 Random Select</RandomBtn>
              </SelectionHeader>
              {sections.map(section => (
                <SectionGroup key={section.id}>
                  <SectionName>{section.name}</SectionName>
                  <SectionDesc>{section.description}</SectionDesc>
                  {questionsBySection[section.id]?.map(q => (
                    <QuestionItem key={q.id}>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(q.id)}
                        onChange={() => toggleQuestion(q.id)}
                      />
                      <div>
                        <DifficultyBadge difficulty={q.difficulty} />{' '}
                        <span style={{ fontSize: 14 }}>
                          {q.text.length > 100 ? q.text.substring(0, 100) + '...' : q.text}
                        </span>
                      </div>
                    </QuestionItem>
                  )) || <p style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>No questions in this section</p>}
                </SectionGroup>
              ))}
            </>
          )}
        </div>
      )}

      {error && <ErrorMsg>{error}</ErrorMsg>}

      {step === 2 && (
        <div>
          <SectionName style={{ marginBottom: 8, fontSize: 18 }}>Time Allocation</SectionName>
          <TotalTime>
            Total: {Object.values(sectionTimes).reduce((a, b) => a + b, 0)} minutes
          </TotalTime>
          {sections.map(section => (
            <SectionGroup key={section.id}>
              <TimeRow>
                <div>
                  <SectionName>{section.name}</SectionName>
                  <SectionDesc style={{ margin: 0 }}>{section.description}</SectionDesc>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TimeInput
                    type="number"
                    min="1"
                    max="60"
                    value={sectionTimes[section.id]}
                    onChange={(e) => setSectionTimes({
                      ...sectionTimes,
                      [section.id]: parseInt(e.target.value) || 1,
                    })}
                  />
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 13 }}>min</span>
                </div>
              </TimeRow>
            </SectionGroup>
          ))}
        </div>
      )}

      <Actions>
        <div>
          {step > 0 && <BackBtn onClick={() => setStep(step - 1)}>Back</BackBtn>}
        </div>
        <div>
          {step < STEPS.length - 1 ? (
            <NextBtn
              onClick={() => setStep(step + 1)}
              disabled={step === 0 && !candidateName.trim()}
            >
              Next
            </NextBtn>
          ) : (
            <SaveBtn
              onClick={handleSave}
              disabled={saving || selectedIds.size === 0}
            >
              {saving ? 'Creating...' : 'Create & Start Interview'}
            </SaveBtn>
          )}
        </div>
      </Actions>
    </Container>
  );
};
