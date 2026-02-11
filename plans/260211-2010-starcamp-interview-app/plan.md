---
title: "Starcamp Interview App - Complete Implementation"
description: "Web app for conducting structured technical interviews with question bank, live sessions, scoring, and PDF/Excel export"
status: pending
priority: P1
effort: 40h
branch: main
tags: [interview-app, react, express, postgresql, prisma, typescript]
created: 2026-02-11
---

# Starcamp Interview App - Implementation Plan

## Overview

Web application for interviewers to conduct structured technical interviews for Starcamp program. Multi-user system with question bank management, live interview sessions with timers, scoring, and comprehensive reporting.

## Tech Stack

- **Frontend:** React.js + Vite + TypeScript + Styled Components
- **Backend:** Node.js + Express + TypeScript
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT (email + password)
- **PDF Export:** @react-pdf/renderer
- **Excel Export:** exceljs
- **Architecture:** Monorepo (`client/` and `server/`)

## Core Features

1. **Authentication** - JWT-based multi-user login
2. **Question Bank** - CRUD questions across 6 sections (Intro, CS Foundations, Whiteboard, Technical, Mindset, Wrap-up)
3. **Interview Setup** - Create sessions, select questions, configure time per section
4. **Live Interview** - Timer per section, question display with answers, 1-5 scoring, notes, auto-save
5. **Results** - View past interviews, scores per question/section/overall
6. **Export** - Generate PDF scorecards and Excel reports

## Implementation Phases

| Phase | Focus | Status | Effort |
|-------|-------|--------|--------|
| [01](./phase-01-project-setup.md) | Project Setup | Pending | 3h |
| [02](./phase-02-database-schema.md) | Database Schema | Pending | 3h |
| [03](./phase-03-auth-system.md) | Authentication | Pending | 4h |
| [04](./phase-04-question-bank-api.md) | Question Bank API | Pending | 4h |
| [05](./phase-05-question-bank-ui.md) | Question Bank UI | Pending | 5h |
| [06](./phase-06-interview-setup.md) | Interview Setup | Pending | 4h |
| [07](./phase-07-live-interview-mode.md) | Live Interview Mode | Pending | 6h |
| [08](./phase-08-interview-results.md) | Interview Results | Pending | 4h |
| [09](./phase-09-export-reports.md) | Export Reports | Pending | 4h |
| [10](./phase-10-testing.md) | Testing | Pending | 3h |

**Total Estimated Effort:** 40 hours

## Key Architectural Decisions

1. **Monorepo Structure** - Single repo with `client/` and `server/` for simplified development
2. **Date-based Timers** - Use `Date()` recalculation to prevent drift when tabs backgrounded
3. **Auto-save Strategy** - Save interview progress every 30s + on section change
4. **Weighted Scoring** - Section scores weighted by importance, aggregated for overall score
5. **File Size Limit** - Keep code files under 200 lines via modularization

## Database Entities

- **Users** - Interviewers (id, email, password_hash, name)
- **Sections** - 6 predefined sections (id, name, description, default_duration)
- **Questions** - Question bank (id, section_id, text, answer, difficulty, created_by)
- **InterviewSessions** - Sessions (id, interviewer_id, candidate_name, date, status)
- **InterviewSectionConfig** - Section time config per session
- **InterviewQuestions** - Selected questions for session
- **Scores** - Per-question scores (id, interview_id, question_id, score_1_to_5, notes)

## Success Criteria

- All tests passing (unit + integration)
- Login/register functional with JWT
- Question CRUD operations complete
- Interview sessions created with custom question selection
- Live timer accurate (no drift), auto-saves work
- Scores calculated correctly with weighted aggregation
- PDF and Excel exports contain accurate data

## Next Steps

Start with **Phase 01: Project Setup** to establish monorepo structure, tooling, and base configuration.
