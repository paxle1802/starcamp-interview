import styled from 'styled-components';
import type { Section } from '../types/section';

const TabsContainer = styled.div`
  display: flex;
  gap: 2px;
  margin-bottom: 20px;
  padding: 3px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  overflow-x: auto;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 8px 18px;
  border: none;
  background: ${({ $active }) => $active ? 'var(--bg-secondary)' : 'transparent'};
  cursor: pointer;
  font-weight: ${({ $active }) => $active ? '600' : '400'};
  font-size: 13px;
  color: ${({ $active }) => $active ? 'var(--text-primary)' : 'var(--text-secondary)'};
  border-radius: var(--radius-sm);
  white-space: nowrap;
  transition: all var(--transition);
  box-shadow: ${({ $active }) => $active ? 'var(--shadow-sm)' : 'none'};

  &:hover {
    color: var(--text-primary);
  }
`;

interface Props {
  sections: Section[];
  activeSection: string | null;
  onChange: (sectionId: string | null) => void;
}

export const SectionTabs = ({ sections, activeSection, onChange }: Props) => (
  <TabsContainer>
    <Tab $active={activeSection === null} onClick={() => onChange(null)}>
      All Sections
    </Tab>
    {sections.map(section => (
      <Tab
        key={section.id}
        $active={activeSection === section.id}
        onClick={() => onChange(section.id)}
      >
        {section.name}
      </Tab>
    ))}
  </TabsContainer>
);
