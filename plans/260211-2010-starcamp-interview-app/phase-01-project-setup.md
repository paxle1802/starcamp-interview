# Phase 01: Project Setup

## Overview

**Priority:** P1 (Critical - Foundation)
**Status:** Pending
**Effort:** 3h

Initialize monorepo structure with Vite (React + TypeScript frontend), Express (TypeScript backend), PostgreSQL, Prisma ORM. Configure tooling, linting, base routing.

## Key Insights

- Monorepo simplifies development (shared types, single deploy)
- Vite provides fast HMR for React development
- TypeScript enforced across both client/server reduces runtime errors
- Prisma generates type-safe database client from schema

## Requirements

### Functional
- Monorepo with `client/` and `server/` directories
- React app runs on port 5173 (Vite default)
- Express API runs on port 3001
- PostgreSQL connection established
- CORS configured for local development

### Non-Functional
- TypeScript strict mode enabled
- ESLint configured for code quality
- Development environment runs both apps concurrently
- Git initialized with proper .gitignore

## Architecture

```
starcamp-interview/
├── client/                 # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/      # API client
│   │   ├── types/
│   │   ├── utils/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── server/                 # Express + TypeScript
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── index.ts
│   ├── prisma/
│   │   └── schema.prisma
│   ├── package.json
│   └── tsconfig.json
├── package.json            # Root workspace
└── .gitignore
```

## Related Code Files

### Files to Create
- `/package.json` - Root workspace config
- `/client/package.json` - Frontend dependencies
- `/client/vite.config.ts` - Vite configuration
- `/client/tsconfig.json` - TypeScript config (client)
- `/client/src/main.tsx` - React entry point
- `/client/src/App.tsx` - Root component
- `/client/index.html` - HTML template
- `/server/package.json` - Backend dependencies
- `/server/tsconfig.json` - TypeScript config (server)
- `/server/src/index.ts` - Express entry point
- `/server/prisma/schema.prisma` - Initial Prisma schema
- `/.gitignore` - Git ignore patterns
- `/.env.example` - Environment variable template

## Implementation Steps

1. **Initialize root workspace**
   ```bash
   mkdir starcamp-interview && cd starcamp-interview
   npm init -y
   ```

2. **Setup client (React + Vite + TypeScript)**
   ```bash
   npm create vite@latest client -- --template react-ts
   cd client
   npm install
   npm install styled-components
   npm install -D @types/styled-components
   ```

3. **Setup server (Express + TypeScript)**
   ```bash
   mkdir server && cd server
   npm init -y
   npm install express cors dotenv bcrypt jsonwebtoken
   npm install -D typescript @types/node @types/express @types/cors @types/bcrypt @types/jsonwebtoken ts-node-dev
   npx tsc --init
   ```

4. **Install Prisma**
   ```bash
   cd server
   npm install prisma @prisma/client
   npx prisma init
   ```

5. **Configure TypeScript (server)**
   - Update `server/tsconfig.json`:
     - `"outDir": "./dist"`
     - `"rootDir": "./src"`
     - `"strict": true`
     - `"esModuleInterop": true`

6. **Create basic Express server**
   - Create `server/src/index.ts` with Express app, CORS, health check route
   - Add `"dev": "ts-node-dev --respawn src/index.ts"` to server package.json scripts

7. **Configure CORS**
   - Allow origin: `http://localhost:5173`
   - Credentials: true

8. **Setup environment variables**
   - Create `.env` (add to .gitignore)
   - Variables: `DATABASE_URL`, `JWT_SECRET`, `PORT`
   - Create `.env.example` with placeholder values

9. **Configure root workspace**
   - Update root `package.json` with workspaces: `["client", "server"]`
   - Add scripts:
     - `"dev:client": "npm run dev --workspace=client"`
     - `"dev:server": "npm run dev --workspace=server"`
     - `"dev": "concurrently \"npm run dev:client\" \"npm run dev:server\""`
   - Install concurrently: `npm install -D concurrently`

10. **Create .gitignore**
    ```
    node_modules/
    dist/
    .env
    .DS_Store
    *.log
    ```

11. **Test setup**
    - Run `npm run dev` from root
    - Verify React app loads at http://localhost:5173
    - Verify Express API responds at http://localhost:3001/health

## Todo List

- [ ] Initialize root workspace with npm
- [ ] Create client with Vite React-TS template
- [ ] Install styled-components in client
- [ ] Setup server directory with Express + TypeScript
- [ ] Install Prisma in server
- [ ] Configure TypeScript for server (strict mode)
- [ ] Create basic Express app with health check route
- [ ] Configure CORS for localhost:5173
- [ ] Setup .env and .env.example files
- [ ] Configure root workspace with concurrently
- [ ] Create comprehensive .gitignore
- [ ] Test both client and server run successfully
- [ ] Verify API health check returns 200

## Success Criteria

- `npm run dev` starts both client and server
- React app accessible at http://localhost:5173
- Express API accessible at http://localhost:3001
- `/health` endpoint returns `{ status: 'ok' }`
- No TypeScript compilation errors
- CORS allows client to call server APIs
- .env file excluded from git

## Risk Assessment

**Risk:** Port conflicts (5173, 3001 already in use)
**Mitigation:** Use `lsof -i :PORT` to check, configure alternative ports if needed

**Risk:** PostgreSQL not installed locally
**Mitigation:** Include PostgreSQL installation instructions in .env.example

**Risk:** TypeScript config conflicts between client/server
**Mitigation:** Use separate tsconfig.json files, don't share root config

## Security Considerations

- `.env` file must be in .gitignore (never commit secrets)
- Generate strong random JWT_SECRET (32+ chars)
- CORS restricted to localhost during development
- Production CORS will need environment-specific origin

## Next Steps

Proceed to **Phase 02: Database Schema** to define Prisma models for Users, Sections, Questions, InterviewSessions, Scores.
