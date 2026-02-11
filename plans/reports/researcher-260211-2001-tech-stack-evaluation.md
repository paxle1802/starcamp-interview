# Tech Stack Evaluation: Starcamp Interview App

**Date:** 2026-02-11
**Focus:** SaaS interview management tool for interviewers (multi-user, question bank, live sessions, scoring, export)

---

## Summary & Recommendation

**Recommended:** Option B (Next.js + Supabase + shadcn/ui)

**Rationale:** Best balance of development speed, simplicity, built-in auth, managed infrastructure, and cost efficiency for small-to-medium scale. Supabase's PostgreSQL + Row Level Security + built-in auth eliminates significant boilerplate. Next.js App Router + Server Components enables rapid feature delivery.

---

## Stack Options Comparison

### Option A: Next.js + PostgreSQL + Prisma + NextAuth/Better-Auth

**Architecture:**
- Full-stack Next.js (App Router, Server Components, API routes)
- Self-hosted/managed PostgreSQL (Neon, Vercel Postgres, Railway)
- Prisma ORM for type-safe queries
- NextAuth v5 or Better-Auth for authentication
- Tailwind + shadcn/ui for UI

**Pros:**
- Full control over DB and auth logic
- Excellent TypeScript DX with Prisma schema → types
- Server Components reduce client bundle, fast initial loads
- Unified codebase (no separate backend repo)
- Easy Vercel deployment (Next.js optimized)
- Better-Auth offers modern, type-safe auth alternative to NextAuth

**Cons:**
- More initial setup (DB connection, auth config, middleware)
- Need to manage DB migrations manually
- Auth implementation requires more code than Supabase
- Must handle DB backups/scaling yourself (unless using managed service)
- PDF generation libraries (react-pdf, puppeteer) require server-side setup

**Fit for Requirements:**
- ✅ Relational data: Prisma schema handles users, questions, sections, interviews, scores well
- ✅ Auth: NextAuth/Better-Auth mature but requires config
- ✅ Export: Libraries available (jsPDF, ExcelJS, Puppeteer) via API routes
- ⚠️ Deployment: Simple on Vercel but need separate DB hosting

---

### Option B: Next.js + Supabase + shadcn/ui

**Architecture:**
- Next.js (App Router, Server Components)
- Supabase (managed PostgreSQL, auth, realtime, storage, edge functions)
- Supabase JS client + Server-Side Auth
- Tailwind + shadcn/ui

**Pros:**
- Fastest initial setup (Supabase handles auth, DB, migrations via dashboard)
- Built-in auth with email/password, magic links, OAuth providers
- Row Level Security (RLS) for multi-tenant data isolation by interviewer
- Real-time subscriptions (potential for collaborative features if needed)
- Free tier generous: 500MB DB, 50K monthly active users, 2GB bandwidth
- Database migrations via Supabase CLI or dashboard
- Edge Functions for serverless backend logic if needed
- TypeScript types auto-generated from Supabase schema

**Cons:**
- Vendor lock-in to Supabase ecosystem
- Less control over DB optimizations (though can use raw SQL)
- RLS policies add learning curve for complex permissions
- Supabase JS client bundle adds ~50KB (mitigated by Server Components)

**Fit for Requirements:**
- ✅ Relational data: PostgreSQL with foreign keys, joins, transactions
- ✅ Auth: Drop-in solution with user management UI
- ✅ Export: Use API routes + libraries (jsPDF, ExcelJS) or Supabase Edge Functions
- ✅ Deployment: Vercel + Supabase (separate free-tier services)
- ✅ Cost: Free tier covers early stage, $25/month Pro tier for growth

---

### Option C: React + Vite + Node.js/Express + PostgreSQL + Prisma

**Architecture:**
- React SPA (Vite for build tooling)
- Separate Express backend API
- PostgreSQL + Prisma
- Manual auth implementation or Passport.js
- Tailwind (frontend only)

**Pros:**
- Clear separation of concerns (frontend/backend)
- Flexibility in API design (REST, GraphQL)
- Easier to scale backend independently

**Cons:**
- Significantly more boilerplate (two separate codebases)
- Auth requires manual session management, JWT handling
- CORS configuration needed
- Two deployment pipelines (frontend + backend)
- Slower development velocity vs full-stack frameworks
- SEO limitations (SPA, though not critical for this app)
- No built-in SSR/streaming (slower initial load)

**Fit for Requirements:**
- ✅ Relational data: Prisma works well
- ⚠️ Auth: More complex (implement from scratch or use Passport)
- ✅ Export: Node.js has mature libraries (node-xlsx, pdfkit)
- ❌ Deployment: Requires two services (Railway, Render, or separate Vercel + Railway)
- ⚠️ Development speed: Slowest of three options

---

## Detailed Evaluation Matrix

| Criterion | Option A (Next.js + Prisma) | Option B (Next.js + Supabase) | Option C (React + Express) |
|-----------|---------------------------|------------------------------|---------------------------|
| **Development Speed** | Fast (unified stack) | **Fastest** (BaaS shortcuts) | Slow (dual repos) |
| **Simplicity (KISS)** | Moderate (auth config) | **High** (integrated services) | Low (more moving parts) |
| **Auth Ease** | Good (NextAuth/Better-Auth) | **Excellent** (built-in) | Poor (manual implementation) |
| **Data Model Fit** | Excellent (Prisma schema) | **Excellent** (PostgreSQL + RLS) | Excellent (Prisma schema) |
| **Export (PDF/Excel)** | Good (API routes + libs) | Good (API routes + libs) | Good (Node libs) |
| **Deployment** | Simple (Vercel + DB host) | **Simplest** (Vercel + Supabase) | Complex (2 services) |
| **Cost (small scale)** | ~$20-40/mo (Neon/Vercel DB) | **$0-25/mo** (free tier → Pro) | ~$30-50/mo (2 services) |
| **Type Safety** | Excellent (Prisma) | **Excellent** (auto-generated) | Excellent (Prisma) |
| **Learning Curve** | Moderate | **Low** (less to configure) | High (more concepts) |

---

## Implementation Notes

### Recommended Stack (Option B) Details

**Database Schema (Supabase PostgreSQL):**
```sql
-- Users (handled by Supabase Auth, extends with profiles)
-- Questions (id, section_id, content, answer_key, difficulty, created_by)
-- Sections (id, name, description)
-- Interviews (id, interviewer_id, candidate_name, date, structure_json)
-- InterviewSections (id, interview_id, section_id, duration_minutes, order)
-- Scores (id, interview_id, question_id, score_1_to_5)
```

**Auth Flow:**
- Supabase Auth handles signup/login
- RLS policies filter questions/interviews by `user_id`
- Example RLS: `CREATE POLICY interviewer_own_data ON interviews FOR SELECT USING (auth.uid() = interviewer_id)`

**Export Implementation:**
- Server Action (Next.js) or API route generates PDF via `react-pdf` or `puppeteer`
- ExcelJS for Excel exports
- Return blob or stream to client

**Key Libraries:**
- `@supabase/ssr` for Server Components auth
- `@supabase/supabase-js` for client-side queries
- `jspdf` + `jspdf-autotable` for PDF generation
- `exceljs` for Excel exports
- `shadcn/ui` components (Button, Table, Dialog, Form, DatePicker)

**Deployment:**
- Frontend: Vercel (free tier, auto-deploys from Git)
- Backend: Supabase (free tier: 500MB DB, 2GB bandwidth)
- Cost: $0 until ~1000 interviews/month, then $25/mo Supabase Pro

---

## Alternative Considerations

### If Choosing Option A Instead:

**When to prefer:**
- Need full DB control (complex queries, custom extensions)
- Want to avoid vendor lock-in
- Already have PostgreSQL infrastructure

**Recommended Adjustments:**
- Use **Better-Auth** over NextAuth (better TypeScript, simpler API)
- Use **Neon** or **Vercel Postgres** for managed DB (~$20/mo)
- Use **Vercel Blob** for file uploads if needed

### If Choosing Option C:

**Not recommended unless:**
- Team has strong preference for SPA architecture
- Need separate backend for mobile apps (though Supabase works for mobile too)
- Already have Express infrastructure

---

## Risk Assessment

### Option B (Recommended) Risks:

**Vendor Lock-in:**
- *Mitigation:* Supabase is open-source (can self-host), data exportable as PostgreSQL dump
- *Severity:* Low (migration path exists via Prisma + custom auth)

**RLS Complexity:**
- *Mitigation:* Start simple (user_id checks), iterate as needed
- *Severity:* Low (well-documented, community support)

**Free Tier Limits:**
- *Mitigation:* Monitor usage, upgrade to Pro ($25/mo) when needed
- *Severity:* Very Low (generous limits for small-medium scale)

---

## Final Recommendation

**Choose Option B (Next.js + Supabase)** for:
- Solo/small team development (fastest time-to-market)
- Built-in auth + RLS eliminates security boilerplate
- Cost-effective scaling ($0 → $25/mo → $100/mo tiers)
- Simple deployment (one-click Vercel integration)
- Modern DX (TypeScript, Server Components, auto-generated types)

**Migration Path:** If outgrow Supabase, export PostgreSQL data and migrate to Option A with Prisma (schema translation straightforward).

---

## Unresolved Questions

1. **Real-time requirements:** Do multiple interviewers need to collaborate on same interview session? (Supabase real-time enables this, but adds complexity if not needed)
2. **File uploads:** Will app need to upload/store interview recordings or documents? (Supabase Storage vs Vercel Blob vs S3)
3. **Candidate portal:** Future plans for candidate-facing features? (Impacts multi-tenant RLS design)
4. **Export format specifics:** PDF layout requirements? Excel formulas/charts needed? (Affects library choice)
5. **Email notifications:** Need transactional emails (interview reminders, report sharing)? (Resend, SendGrid integration)
