# Interview App Patterns Research Report

**Date:** 2026-02-11
**Context:** Starcamp Interview App (interviewer-facing technical interview tool)
**Scope:** Timer patterns, scoring systems, PDF/Excel generation, question banks, session state

---

## 1. Timer/Stopwatch Patterns

### Best Practices
- **Use Date() recalculation** - Store start time as `new Date()`, recalculate elapsed time on each tick instead of incrementing counter
- **Prevents drift** - Browser throttles `setInterval` in background tabs (once per minute), Date-based approach "catches up" when tab refocuses
- **Interval choice** - 100ms `setInterval` for reasonable balance between accuracy and performance
- **React hooks** - `useState` for displayed time, `useEffect` for setup/cleanup of interval

### Implementation Pattern
```javascript
const [startTime] = useState(new Date());
const [elapsed, setElapsed] = useState(0);

useEffect(() => {
  const interval = setInterval(() => {
    setElapsed(new Date() - startTime);
  }, 100);
  return () => clearInterval(interval);
}, [startTime]);
```

### Next.js Considerations
- Use `"use client"` directive for client-side rendering
- Timer components must run in browser environment

**Sources:** [Reddit](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGMbBIS2TE9J55vN4VA4j6WsN7eysdf3vOKfKl8KTs16wVItsiTax6T8cj6rouC_m3kIIgonZFZ8tRXLND-8J2uxOQ7t9HMRsoQ3Ojelk7hV4NDwclotkdvnFZV069424XvzAeJsRycnY4Z-of83rYTchA8DlZiDyaGvAMLzrAII3RAd9T7h8zJU3BZv-qFnnBwJTsImvfToCE=), [Medium](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGdnx8iKHW_R_b_7CAKb2H2gZhIm-29g4qfEWf-CB-idaY5qxGzhx3O4pg-SMGi7hS5bpTLFJZnBpprq8KzCjIH1qu7HW8zIg6kvyhESzwmRxZ4akzrjSlLY3l_gtBtQ5huAkd4G9vhQayaPtWTzGvnE36-0clb_QIUBUbHzu6wSqShBU6jajAc_Pg0eqo3vnYw)

---

## 2. Scoring/Rubric Systems

### UX Patterns for Live Interviews
- **Rating scale** - 1-5 or 1-7 scale with clear definitions for each point
- **Define criteria** - Each rating level needs specific description + examples
  - Example: 1 = "Below Expectations", 3 = "Meets Expectations", 5 = "Exceeds Expectations"
- **Quick access** - Radio buttons or button groups for rapid scoring during live sessions
- **Notes field** - Essential for context on ratings

### Aggregate Score Calculation
- **Weighted averages** - Different sections can have different weights
- **Normalize scales** - If mixing scales (e.g., 1-5 and 1-7), convert to common range
- **Formula**: `totalScore = Σ(sectionScore × weight) / Σ(weights)`

### Interview Scorecard Structure
```
Section: Algorithm Design
- Problem Understanding (1-5)
- Solution Approach (1-5)
- Code Quality (1-5)
- Time/Space Complexity (1-5)
- Notes: [text area]

Section Weight: 0.4
Section Score: avg(ratings) × weight
```

**Sources:** [Interaction Design](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFjJ11M6pml_nHQF4htKSnZN8TI5P6iIPYR3VJ-89dhiq-ES0S4cChFmcybYoypWqrj4VCBR1ahiVcZe8-dEinQQTeeRXg1Cs2ZShC9b2p4cxIwUT8o1YwkkxtSfk7vWQil6SrtRQy3LgytR62mheDb4SHytLcY9ij9FGKI_mZQei6HMkLgfgcv6qn5M7CA), [HackerEarth](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGttFCPZphFOmj9IIUTINGSHta7f89MFusNmEmkLJhZnyVl9jYJp-AeMpP2jaeeyYavMyQDPGsRsFuQvqYgCKS4QsCtPMpDs-5nCVt-svWmIE75bJ4JOYLe3_gzyaaGAJhmc6tfMHOq-f30a2QtybI=)

---

## 3. PDF/Excel Report Generation

### PDF Generation Libraries

#### `@react-pdf/renderer` (recommended for structured reports)
- **Pros**: React-centric component approach, lighter than Puppeteer for simple layouts
- **Cons**: Limited for complex HTML/CSS replication
- **Use case**: Invoices, scorecards, structured interview reports
- **Package**: `@react-pdf/renderer`

#### `puppeteer`
- **Pros**: Pixel-perfect HTML/CSS conversion, handles complex layouts
- **Cons**: Heavy (200-500MB per instance), brutal cold starts in serverless (3-10s), memory intensive
- **Recommendation**: Run in separate containerized service, NOT in Next.js server
- **Package**: `puppeteer`

#### `jspdf`
- **Pros**: Client-side, no server load
- **Cons**: Limited HTML/CSS support, primarily client-side only
- **Use case**: Simple browser-initiated PDFs
- **Package**: `jspdf`

#### Recommendation for Interview App
Use `@react-pdf/renderer` for server-side scorecard generation. Consider dedicated PDF service if complex layouts needed.

### Excel Generation Libraries

#### `exceljs` (recommended for interview app)
- **Pros**: Rich styling, cell formatting, data validation, conditional formatting, image embedding, formula support
- **Cons**: Slightly heavier than xlsx
- **Use case**: Formatted reports with styling, charts, multiple sheets
- **Package**: `exceljs`

#### `xlsx` (SheetJS)
- **Pros**: High performance, broad format support (XLSX, CSV, HTML tables)
- **Cons**: npm package outdated with vulnerabilities, install from CDN instead
- **Use case**: Fast parsing/writing, cross-platform compatibility priority
- **Package**: `xlsx` (install from SheetJS CDN for security)

#### Recommendation
Use `exceljs` for interview reports requiring formatting, conditional formatting for score ranges (e.g., red for low scores).

**Sources:** [BlazePDF](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGcsv72wPL8WBNPETWEQrzLDTzMIE1K0ZgHBBvaSiBYemHjyB9CGaYAuVqz-MDI6gjh3GFkMsx9v-iKIESQMdL5z0R2PPuWt6sMZyzAJRGXW18APaDrnRthjRjFENjiOv46QnZvmE9dPTiGeiuaDjn_q4Kpf6-k6ZR4mKD9JUSo3MF7-V2IbdcZzjyjCNxw-Yv7Iu4APac=), [Medium Excel](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEfOQkNne5-vHl_wh-rS-F9dQVfuX78qdujxjJIBH1LUk7apZAETfSDA84MZagsS4tUXay8_YEDuTgo2QP-BBhIwhBTUzaKKhPdmKEY-sj5IpfeL9SrKXBtAmv7UHCv_--XRhO2CDQeFAVOiLO7dgoaQ6r6uGoriAZGd-8naed7-HKANZ0NJBTqf_9JDRYvxfk_1HLZNdk0xS4KzWXqkw==)

---

## 4. Question Bank Data Modeling

### Schema Design

#### Core Entities
```sql
Questions
- question_id (PK)
- question_text
- question_type (multiple-choice, coding, system-design)
- correct_answer
- explanation
- creation_date
- last_modified_date
- creator_id (FK -> Users)
- difficulty_id (FK -> DifficultyLevels)
- status (active, inactive, draft)

Categories
- category_id (PK)
- category_name
- parent_category_id (self-referencing FK for hierarchy)

Question_Category (junction table)
- question_id (FK)
- category_id (FK)

DifficultyLevels
- difficulty_id (PK)
- difficulty_name (Easy, Medium, Hard)
- difficulty_score (1-5 numeric)

Answers (for multiple-choice)
- answer_id (PK)
- question_id (FK)
- answer_text
- is_correct (boolean)

Tags
- tag_id (PK)
- tag_name

Question_Tags (junction table)
- question_id (FK)
- tag_id (FK)
```

### Versioning Strategy

#### Option 1: Version Table
```sql
QuestionVersions
- question_version_id (PK)
- question_id (FK)
- version_number
- version_text
- version_answer
- effective_date
- deprecated_date
```

#### Option 2: Soft Delete with Status
- Keep old versions with `status = 'inactive'`
- Create new record for updates with `status = 'active'`
- Link via `parent_question_id` for history

**Sources:** [ResearchGate](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFsTIP-6S5SjbM1XCEDMJng7lQjc1_asOxovSniIOrFarLfBiy2cUXG3ecORME-KAkO4rORDUWM1zimXmYaV-72GcKeaFCfU7vqZdquAGNlFFARo0IVu5QeiqhOqoYXb6BldnffXk9LDOkwlWKvc0qymzJnoocM9dFaihc3_S4oCgIA0POLuLBJjGdw806MwWcC4eRgCTlsnoJFE1fpgBr2xUZob-fJLg==)

---

## 5. Interview Session State Management

### Persistence Strategies

#### Client-Side Storage
- **`localStorage`** - Persists across browser restarts, use for non-sensitive UI state
- **`sessionStorage`** - Clears on tab close, use for temporary session data
- **Custom hook pattern**:
```javascript
function usePersistState(key, defaultValue) {
  const [state, setState] = useState(() => {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}
```

#### Server-Side Session Management
- **Session components**: Session ID (in cookie), session store (database/Redis), session data, timeout, session cookie
- **Cookies** - Preferred for authentication and sensitive session data
- **Next.js App Router considerations**:
  - **Server Components** - No useState/useEffect, ideal for data fetching
  - **Client Components** - Use `"use client"` for state management, localStorage access
  - **Session flow**: Store session ID in httpOnly cookie, store progress/state server-side

### Recommended Approach for Interview App
1. **Active interview state** - Server-side session store (Redis/PostgreSQL)
2. **UI preferences** - localStorage (timer display, layout)
3. **Progress checkpoints** - Auto-save to server every 30s or on section change
4. **Recovery** - On page refresh, fetch session from server by session ID

**Sources:** [Dev.to State](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGxc-3_o2R1AqEAp5RtDxw3B0CekR7MMtdI_iZ81w6nvWDGssZekkwXmdrb4UhE0sj-RnDrl2ulKGEgZ5FLFLrvBrIZK7YG_S5QYB5w3jN_g6xhTqEbEZ1cLTMVUowOsLgCfFXo8URKI7bf_TfB1_-wm-bTL_DncIItsMPON6sp), [Clerk Session](https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQE93YnLJ0MZ1sCcXkjaTGY_5fxAOxIjj-mDeGxQy70YftOeGDU4wEhGfax5aFWEtHvKmXkx_5DwmNyseJhqBOyXtixqBEDIrw1l9J0jllwJ-HHmnJJ1WD1OhmksSqhu2LoAsNZt4ABfQhDx-X1YpOcS5c-xVCz8909vvA==)

---

## Summary

### Key NPM Packages
- **Timers**: Built-in React hooks (`useState`, `useEffect`)
- **PDF**: `@react-pdf/renderer` (primary), `puppeteer` (dedicated service only)
- **Excel**: `exceljs` (recommended), `xlsx` (performance-critical)
- **State**: Custom hooks with localStorage, server-side sessions

### Architecture Recommendations
1. Client-side timers with Date() recalculation for accuracy
2. 1-5 scoring scales with weighted section aggregation
3. Server-side PDF/Excel generation in Next.js API routes
4. Relational DB schema with versioning for question bank
5. Hybrid state: server sessions for data, localStorage for UI

---

## Unresolved Questions
- Authentication library choice (NextAuth.js, Clerk, custom)?
- Database choice (PostgreSQL, MySQL, MongoDB)?
- Real-time collaboration requirements (multiple interviewers)?
- Mobile interviewer support requirements?
- Question bank size expectations (impacts search strategy)?
