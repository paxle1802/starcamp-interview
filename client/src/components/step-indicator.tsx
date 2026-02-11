import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  gap: 0;
  margin-bottom: 32px;
`;

const Step = styled.div<{ $active: boolean; $completed: boolean }>`
  flex: 1;
  text-align: center;
  padding: 14px 8px;
  font-size: 13px;
  font-weight: ${({ $active }) => ($active ? '600' : '400')};
  color: ${({ $active, $completed }) =>
    $completed ? 'var(--green)' : $active ? 'var(--accent)' : 'var(--text-tertiary)'};
  position: relative;
  transition: all var(--transition);

  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3px;
    border-radius: 3px;
    background: ${({ $active, $completed }) =>
      $completed ? 'var(--green)' : $active ? 'var(--accent)' : 'var(--bg-tertiary)'};
    transition: all var(--transition-slow);
  }
`;

const StepNumber = styled.span<{ $active: boolean; $completed: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 600;
  margin-right: 6px;
  background: ${({ $active, $completed }) =>
    $completed ? 'var(--green)' : $active ? 'var(--accent)' : 'var(--bg-tertiary)'};
  color: ${({ $active, $completed }) =>
    $completed || $active ? 'white' : 'var(--text-tertiary)'};
  transition: all var(--transition);
`;

interface Props {
  currentStep: number;
  steps: string[];
}

export const StepIndicator = ({ currentStep, steps }: Props) => (
  <Container>
    {steps.map((step, idx) => (
      <Step key={idx} $active={idx === currentStep} $completed={idx < currentStep}>
        <StepNumber $active={idx === currentStep} $completed={idx < currentStep}>
          {idx < currentStep ? '\u2713' : idx + 1}
        </StepNumber>
        {step}
      </Step>
    ))}
  </Container>
);
