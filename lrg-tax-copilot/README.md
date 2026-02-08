# LRG Tax Copilot

Internal AI assistant for LRG Tax Services staff. Supports drafting, research, and decision support for tax professionals — not a tax preparer or advisor.

## Features

- **Auto-detect interaction modes** — Risk Review (RR), Client Response Drafting (CRD), Pricing/Scope (PLS), Internal Talking Points (ITP), Educational Content (EDU)
- **Notion knowledge base retrieval** — Pulls firm policies, templates, pricing rules, and topic briefs
- **Guardrail enforcement** — No estimates, conservative position standard, scope boundaries
- **JWT authentication** — Role-based access (staff / firm_owner)
- **Request logging** — Operational metadata only, no prompt text stored

## Architecture

- **Backend**: Express + TypeScript, Claude AI (Sonnet), Notion API, SQLite (auth + logs)
- **Frontend**: Next.js 14, React 18, Tailwind CSS

## Setup

### Prerequisites

- Node.js 18+
- Anthropic API key
- (Optional) Notion API key and database IDs — falls back to placeholder data without them

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

The backend runs on `http://localhost:3001`.

### Frontend

```bash
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
npm run dev
```

The frontend runs on `http://localhost:3000`.

### Default Login

- **Username**: `admin`
- **Password**: `changeme123`
- **Role**: firm_owner

> Change the default password immediately after first login.

## Environment Variables

### Backend (.env)

| Variable | Required | Description |
|---|---|---|
| `PORT` | No | Server port (default: 3001) |
| `FRONTEND_URL` | Prod | CORS origin (default: http://localhost:3000) |
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for Claude |
| `JWT_SECRET` | Prod | JWT signing secret (min 32 chars) |
| `NOTION_API_KEY` | No | Notion integration token |
| `NOTION_POLICIES_DB_ID` | No | Notion policies database ID |
| `NOTION_TEMPLATES_DB_ID` | No | Notion templates database ID |
| `NOTION_PRICING_RULES_DB_ID` | No | Notion pricing rules database ID |
| `NOTION_TOPIC_BRIEFS_DB_ID` | No | Notion topic briefs database ID |

### Frontend (.env.local)

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: http://localhost:3001) |

## API Endpoints

### Auth

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Authenticate and get JWT |
| GET | `/auth/me` | Bearer | Current user info |
| POST | `/auth/change-password` | Bearer | Change own password |
| GET | `/auth/users` | Owner | List all users |
| POST | `/auth/users` | Owner | Create user |
| POST | `/auth/users/:id/deactivate` | Owner | Deactivate user |
| POST | `/auth/users/:id/activate` | Owner | Activate user |
| POST | `/auth/users/:id/reset-password` | Owner | Reset user password |

### Chat

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/chat` | Bearer | Send message, get AI response |
| GET | `/health` | Public | Health check |

## Project Structure

```
lrg-tax-copilot/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server entry point
│   │   ├── config/index.ts       # Environment and app configuration
│   │   ├── types/                # TypeScript type definitions
│   │   ├── services/
│   │   │   ├── modeDetector.ts   # Two-stage mode classification
│   │   │   ├── notionRetrieval.ts # Notion knowledge base retrieval
│   │   │   ├── notionParser.ts   # Notion API response parsing
│   │   │   ├── claudeClient.ts   # Claude API client with prompt assembly
│   │   │   ├── authService.ts    # User management and JWT
│   │   │   └── logger.ts        # Request logging (no PII)
│   │   ├── middleware/auth.ts    # JWT auth middleware
│   │   ├── routes/               # API route handlers
│   │   └── prompts/              # System prompt templates
│   └── database/                 # SQLite databases (auto-created)
├── frontend/
│   └── src/
│       ├── app/                  # Next.js app router pages
│       ├── components/           # React components
│       └── lib/                  # Auth utilities and API client
└── README.md
```
