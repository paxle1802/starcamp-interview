# Phase 05: Question Bank UI

## Overview

**Priority:** P1 (Critical)
**Status:** Pending
**Effort:** 5h

Build React frontend for question bank management: list view with filters, create/edit forms, delete confirmation, section tabs.

## Key Insights

- Styled Components for styling (CSS-in-JS)
- Section tabs for easy navigation (6 sections)
- Filter by difficulty + tags on top of section filter
- Question cards show preview, full view shows answer
- Form reused for create and edit modes
- API client service centralizes all HTTP calls

## Requirements

### Functional
- Question list page with section tabs
- Difficulty filter dropdown (All, Easy, Medium, Hard)
- Tag filter input (comma-separated)
- Create new question button → modal/form
- Edit question button (only creator sees it)
- Delete question button with confirmation (only creator)
- Question card shows: text preview (100 chars), difficulty badge, tags
- Click card to view full question + answer
- Forms validate required fields
- Success/error toast notifications

### Non-Functional
- Responsive design (desktop + tablet)
- Loading states during API calls
- Empty state when no questions in section
- Pagination controls if >50 questions
- Keyboard navigation for accessibility

## Architecture

```
QuestionBankPage
├── SectionTabs (6 tabs)
├── FilterBar
│   ├── DifficultyFilter
│   └── TagFilter
├── QuestionList
│   └── QuestionCard[] (map questions)
│       ├── QuestionPreview
│       ├── DifficultyBadge
│       ├── TagList
│       └── ActionButtons (Edit, Delete)
├── Pagination
└── QuestionModal (Create/Edit form)
```

### State Management
- React hooks (useState, useEffect)
- No external state lib needed (small app)
- API client service handles requests

## Related Code Files

### Files to Create
- `/client/src/pages/question-bank-page.tsx` - Main page component
- `/client/src/components/section-tabs.tsx` - Section navigation
- `/client/src/components/filter-bar.tsx` - Difficulty and tag filters
- `/client/src/components/question-list.tsx` - List container
- `/client/src/components/question-card.tsx` - Individual question card
- `/client/src/components/question-modal.tsx` - Create/edit form
- `/client/src/components/difficulty-badge.tsx` - Colored difficulty label
- `/client/src/components/confirm-dialog.tsx` - Delete confirmation
- `/client/src/services/api-client.ts` - Axios instance with auth
- `/client/src/services/question-service.ts` - Question API calls
- `/client/src/services/section-service.ts` - Section API calls
- `/client/src/types/question.ts` - TypeScript types
- `/client/src/types/section.ts` - Section types

### Files to Modify
- `/client/src/App.tsx` - Add question bank route
- `/client/package.json` - Add axios dependency

## Implementation Steps

1. **Install dependencies**
   ```bash
   cd client
   npm install axios react-router-dom
   npm install -D @types/react-router-dom
   ```

2. **Create TypeScript types**

   Create `client/src/types/section.ts`:
   ```typescript
   export interface Section {
     id: string;
     name: string;
     description: string;
     defaultDuration: number;
     order: number;
   }
   ```

   Create `client/src/types/question.ts`:
   ```typescript
   export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

   export interface Question {
     id: string;
     sectionId: string;
     text: string;
     answer: string;
     difficulty: Difficulty;
     tags: string[];
     createdBy: string;
     createdAt: string;
     section?: {
       id: string;
       name: string;
     };
     creator?: {
       id: string;
       name: string;
     };
   }

   export interface CreateQuestionDTO {
     sectionId: string;
     text: string;
     answer: string;
     difficulty: Difficulty;
     tags: string[];
   }
   ```

3. **Create API client**

   Create `client/src/services/api-client.ts`:
   ```typescript
   import axios from 'axios';

   const apiClient = axios.create({
     baseURL: 'http://localhost:3001/api',
     withCredentials: true, // Send cookies
   });

   export default apiClient;
   ```

4. **Create question service**

   Create `client/src/services/question-service.ts`:
   ```typescript
   import apiClient from './api-client';
   import { Question, CreateQuestionDTO } from '../types/question';

   export const questionService = {
     async list(params?: {
       sectionId?: string;
       difficulty?: string;
       tags?: string;
       page?: number;
     }) {
       const response = await apiClient.get<{
         questions: Question[];
         total: number;
         page: number;
         totalPages: number;
       }>('/questions', { params });
       return response.data;
     },

     async getById(id: string) {
       const response = await apiClient.get<Question>(`/questions/${id}`);
       return response.data;
     },

     async create(data: CreateQuestionDTO) {
       const response = await apiClient.post<Question>('/questions', data);
       return response.data;
     },

     async update(id: string, data: Partial<CreateQuestionDTO>) {
       const response = await apiClient.put<Question>(`/questions/${id}`, data);
       return response.data;
     },

     async delete(id: string) {
       await apiClient.delete(`/questions/${id}`);
     },
   };
   ```

   Create `client/src/services/section-service.ts`:
   ```typescript
   import apiClient from './api-client';
   import { Section } from '../types/section';

   export const sectionService = {
     async list() {
       const response = await apiClient.get<Section[]>('/sections');
       return response.data;
     },
   };
   ```

5. **Create difficulty badge component**

   Create `client/src/components/difficulty-badge.tsx`:
   ```tsx
   import styled from 'styled-components';
   import { Difficulty } from '../types/question';

   const Badge = styled.span<{ difficulty: Difficulty }>`
     padding: 4px 12px;
     border-radius: 12px;
     font-size: 12px;
     font-weight: 600;
     background: ${({ difficulty }) =>
       difficulty === 'EASY' ? '#d4edda' :
       difficulty === 'MEDIUM' ? '#fff3cd' :
       '#f8d7da'};
     color: ${({ difficulty }) =>
       difficulty === 'EASY' ? '#155724' :
       difficulty === 'MEDIUM' ? '#856404' :
       '#721c24'};
   `;

   export const DifficultyBadge = ({ difficulty }: { difficulty: Difficulty }) => (
     <Badge difficulty={difficulty}>{difficulty}</Badge>
   );
   ```

6. **Create question card component**

   Create `client/src/components/question-card.tsx`:
   ```tsx
   import styled from 'styled-components';
   import { Question } from '../types/question';
   import { DifficultyBadge } from './difficulty-badge';

   const Card = styled.div`
     border: 1px solid #e0e0e0;
     border-radius: 8px;
     padding: 16px;
     margin-bottom: 12px;
     cursor: pointer;
     transition: box-shadow 0.2s;

     &:hover {
       box-shadow: 0 2px 8px rgba(0,0,0,0.1);
     }
   `;

   const Header = styled.div`
     display: flex;
     justify-content: space-between;
     align-items: center;
     margin-bottom: 8px;
   `;

   const Tags = styled.div`
     display: flex;
     gap: 8px;
     margin-top: 8px;
   `;

   const Tag = styled.span`
     background: #f0f0f0;
     padding: 2px 8px;
     border-radius: 4px;
     font-size: 11px;
   `;

   const Actions = styled.div`
     display: flex;
     gap: 8px;
   `;

   interface Props {
     question: Question;
     currentUserId: string;
     onEdit: (question: Question) => void;
     onDelete: (id: string) => void;
     onClick: (question: Question) => void;
   }

   export const QuestionCard = ({ question, currentUserId, onEdit, onDelete, onClick }: Props) => {
     const isOwner = question.createdBy === currentUserId;
     const preview = question.text.length > 100
       ? question.text.substring(0, 100) + '...'
       : question.text;

     return (
       <Card onClick={() => onClick(question)}>
         <Header>
           <DifficultyBadge difficulty={question.difficulty} />
           {isOwner && (
             <Actions onClick={(e) => e.stopPropagation()}>
               <button onClick={() => onEdit(question)}>Edit</button>
               <button onClick={() => onDelete(question.id)}>Delete</button>
             </Actions>
           )}
         </Header>
         <p>{preview}</p>
         {question.tags.length > 0 && (
           <Tags>
             {question.tags.map(tag => <Tag key={tag}>{tag}</Tag>)}
           </Tags>
         )}
       </Card>
     );
   };
   ```

7. **Create section tabs component**

   Create `client/src/components/section-tabs.tsx`:
   ```tsx
   import styled from 'styled-components';
   import { Section } from '../types/section';

   const TabsContainer = styled.div`
     display: flex;
     gap: 8px;
     margin-bottom: 24px;
     border-bottom: 2px solid #e0e0e0;
   `;

   const Tab = styled.button<{ active: boolean }>`
     padding: 12px 16px;
     border: none;
     background: none;
     cursor: pointer;
     border-bottom: 2px solid ${({ active }) => active ? '#007bff' : 'transparent'};
     font-weight: ${({ active }) => active ? '600' : '400'};
     color: ${({ active }) => active ? '#007bff' : '#333'};
     margin-bottom: -2px;

     &:hover {
       background: #f8f9fa;
     }
   `;

   interface Props {
     sections: Section[];
     activeSection: string | null;
     onChange: (sectionId: string | null) => void;
   }

   export const SectionTabs = ({ sections, activeSection, onChange }: Props) => (
     <TabsContainer>
       <Tab active={activeSection === null} onClick={() => onChange(null)}>
         All Sections
       </Tab>
       {sections.map(section => (
         <Tab
           key={section.id}
           active={activeSection === section.id}
           onClick={() => onChange(section.id)}
         >
           {section.name}
         </Tab>
       ))}
     </TabsContainer>
   );
   ```

8. **Create filter bar component**

   Create `client/src/components/filter-bar.tsx`:
   ```tsx
   import styled from 'styled-components';
   import { Difficulty } from '../types/question';

   const Container = styled.div`
     display: flex;
     gap: 16px;
     margin-bottom: 24px;
   `;

   const Select = styled.select`
     padding: 8px 12px;
     border: 1px solid #ccc;
     border-radius: 4px;
   `;

   const Input = styled.input`
     padding: 8px 12px;
     border: 1px solid #ccc;
     border-radius: 4px;
     flex: 1;
   `;

   interface Props {
     difficulty: Difficulty | 'ALL';
     tags: string;
     onDifficultyChange: (difficulty: Difficulty | 'ALL') => void;
     onTagsChange: (tags: string) => void;
   }

   export const FilterBar = ({ difficulty, tags, onDifficultyChange, onTagsChange }: Props) => (
     <Container>
       <Select value={difficulty} onChange={(e) => onDifficultyChange(e.target.value as any)}>
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
   ```

9. **Create question modal (create/edit form)**

   Create `client/src/components/question-modal.tsx`:
   ```tsx
   import { useState, useEffect } from 'react';
   import styled from 'styled-components';
   import { Question, CreateQuestionDTO, Difficulty } from '../types/question';
   import { Section } from '../types/section';

   const Overlay = styled.div`
     position: fixed;
     top: 0;
     left: 0;
     right: 0;
     bottom: 0;
     background: rgba(0,0,0,0.5);
     display: flex;
     align-items: center;
     justify-content: center;
   `;

   const Modal = styled.div`
     background: white;
     padding: 24px;
     border-radius: 8px;
     width: 600px;
     max-height: 80vh;
     overflow-y: auto;
   `;

   const Form = styled.form`
     display: flex;
     flex-direction: column;
     gap: 16px;
   `;

   const Label = styled.label`
     font-weight: 600;
     margin-bottom: 4px;
   `;

   const Input = styled.input`
     padding: 8px;
     border: 1px solid #ccc;
     border-radius: 4px;
   `;

   const Textarea = styled.textarea`
     padding: 8px;
     border: 1px solid #ccc;
     border-radius: 4px;
     min-height: 100px;
   `;

   const Select = styled.select`
     padding: 8px;
     border: 1px solid #ccc;
     border-radius: 4px;
   `;

   const Actions = styled.div`
     display: flex;
     gap: 12px;
     justify-content: flex-end;
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
       difficulty: question?.difficulty || 'MEDIUM' as Difficulty,
       tags: question?.tags.join(', ') || '',
     });

     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault();
       await onSave({
         ...formData,
         tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
       });
       onClose();
     };

     return (
       <Overlay onClick={onClose}>
         <Modal onClick={(e) => e.stopPropagation()}>
           <h2>{question ? 'Edit Question' : 'Create Question'}</h2>
           <Form onSubmit={handleSubmit}>
             <div>
               <Label>Section</Label>
               <Select
                 value={formData.sectionId}
                 onChange={(e) => setFormData({ ...formData, sectionId: e.target.value })}
                 required
               >
                 <option value="">Select section</option>
                 {sections.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
               </Select>
             </div>

             <div>
               <Label>Question Text</Label>
               <Textarea
                 value={formData.text}
                 onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                 required
               />
             </div>

             <div>
               <Label>Answer</Label>
               <Textarea
                 value={formData.answer}
                 onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                 required
               />
             </div>

             <div>
               <Label>Difficulty</Label>
               <Select
                 value={formData.difficulty}
                 onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as Difficulty })}
               >
                 <option value="EASY">Easy</option>
                 <option value="MEDIUM">Medium</option>
                 <option value="HARD">Hard</option>
               </Select>
             </div>

             <div>
               <Label>Tags (comma-separated)</Label>
               <Input
                 value={formData.tags}
                 onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                 placeholder="react, typescript, frontend"
               />
             </div>

             <Actions>
               <button type="button" onClick={onClose}>Cancel</button>
               <button type="submit">Save</button>
             </Actions>
           </Form>
         </Modal>
       </Overlay>
     );
   };
   ```

10. **Create main question bank page**

    Create `client/src/pages/question-bank-page.tsx`:
    ```tsx
    import { useState, useEffect } from 'react';
    import styled from 'styled-components';
    import { questionService } from '../services/question-service';
    import { sectionService } from '../services/section-service';
    import { Question, Difficulty } from '../types/question';
    import { Section } from '../types/section';
    import { SectionTabs } from '../components/section-tabs';
    import { FilterBar } from '../components/filter-bar';
    import { QuestionCard } from '../components/question-card';
    import { QuestionModal } from '../components/question-modal';

    const Container = styled.div`
      max-width: 1200px;
      margin: 0 auto;
      padding: 24px;
    `;

    const Header = styled.div`
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    `;

    export const QuestionBankPage = () => {
      const [questions, setQuestions] = useState<Question[]>([]);
      const [sections, setSections] = useState<Section[]>([]);
      const [activeSection, setActiveSection] = useState<string | null>(null);
      const [difficulty, setDifficulty] = useState<Difficulty | 'ALL'>('ALL');
      const [tags, setTags] = useState('');
      const [showModal, setShowModal] = useState(false);
      const [editingQuestion, setEditingQuestion] = useState<Question | undefined>();
      const [loading, setLoading] = useState(false);
      const currentUserId = 'temp-user-id'; // TODO: Get from auth context

      useEffect(() => {
        loadSections();
      }, []);

      useEffect(() => {
        loadQuestions();
      }, [activeSection, difficulty, tags]);

      const loadSections = async () => {
        const data = await sectionService.list();
        setSections(data);
      };

      const loadQuestions = async () => {
        setLoading(true);
        const params: any = {};
        if (activeSection) params.sectionId = activeSection;
        if (difficulty !== 'ALL') params.difficulty = difficulty;
        if (tags) params.tags = tags;

        const { questions } = await questionService.list(params);
        setQuestions(questions);
        setLoading(false);
      };

      const handleCreate = () => {
        setEditingQuestion(undefined);
        setShowModal(true);
      };

      const handleEdit = (question: Question) => {
        setEditingQuestion(question);
        setShowModal(true);
      };

      const handleSave = async (data: any) => {
        if (editingQuestion) {
          await questionService.update(editingQuestion.id, data);
        } else {
          await questionService.create(data);
        }
        loadQuestions();
      };

      const handleDelete = async (id: string) => {
        if (confirm('Delete this question?')) {
          await questionService.delete(id);
          loadQuestions();
        }
      };

      return (
        <Container>
          <Header>
            <h1>Question Bank</h1>
            <button onClick={handleCreate}>Create Question</button>
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
            <p>Loading...</p>
          ) : questions.length === 0 ? (
            <p>No questions found. Create one to get started!</p>
          ) : (
            questions.map(q => (
              <QuestionCard
                key={q.id}
                question={q}
                currentUserId={currentUserId}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onClick={(q) => alert(`Full view: ${q.text}\n\nAnswer: ${q.answer}`)}
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
        </Container>
      );
    };
    ```

11. **Update App.tsx with routing**

    Modify `client/src/App.tsx`:
    ```tsx
    import { BrowserRouter, Routes, Route } from 'react-router-dom';
    import { QuestionBankPage } from './pages/question-bank-page';

    function App() {
      return (
        <BrowserRouter>
          <Routes>
            <Route path="/questions" element={<QuestionBankPage />} />
            <Route path="/" element={<div>Home - Add navigation here</div>} />
          </Routes>
        </BrowserRouter>
      );
    }

    export default App;
    ```

## Todo List

- [ ] Install axios and react-router-dom
- [ ] Create TypeScript types for Question and Section
- [ ] Create API client with credentials support
- [ ] Implement question and section services
- [ ] Create DifficultyBadge component with color coding
- [ ] Create QuestionCard component with preview
- [ ] Create SectionTabs component
- [ ] Create FilterBar component
- [ ] Create QuestionModal form (create/edit)
- [ ] Create QuestionBankPage with state management
- [ ] Add routing in App.tsx
- [ ] Test section tab switching
- [ ] Test difficulty filtering
- [ ] Test tag filtering
- [ ] Test create question flow
- [ ] Test edit question flow (only owner)
- [ ] Test delete question with confirmation
- [ ] Verify loading states display correctly
- [ ] Verify empty state displays when no questions

## Success Criteria

- Section tabs switch between sections correctly
- Filters apply to question list in real-time
- Create question button opens modal with form
- Form validates required fields before submission
- Edit button only visible to question creator
- Delete button requires confirmation
- Question card shows 100-char preview
- Full question view shows complete text and answer
- Tags displayed as chips below question text
- Loading spinner shows during API calls
- Empty state message when no questions match filters

## Risk Assessment

**Risk:** API calls fail due to CORS or auth issues
**Mitigation:** Verify `withCredentials: true` in axios config, test login flow first

**Risk:** State management becomes complex with filters
**Mitigation:** Use useEffect with dependencies to auto-reload on filter changes

**Risk:** Form doesn't reset after submission
**Mitigation:** Close modal and clear editingQuestion state on successful save

## Security Considerations

- API client sends cookies automatically (withCredentials)
- Edit/delete buttons hidden for non-owners (UI-level)
- Server enforces ownership check (primary security)
- No sensitive data in question preview (answer hidden until clicked)

## Next Steps

Proceed to **Phase 06: Interview Setup** to create UI and API for setting up interview sessions with candidate name, question selection, and time configuration.
