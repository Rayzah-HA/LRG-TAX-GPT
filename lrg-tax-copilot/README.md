# LRG Tax Copilot

AI-powered tax assistant for LRG Tax Services, built with Claude AI and Notion integration.

## Architecture

- **Backend**: Express + TypeScript API with Claude AI and Notion integration
- **Frontend**: Next.js 14 + Tailwind CSS chat interface

## Getting Started

### Backend

```bash
cd backend
cp .env.example .env
# Fill in your API keys in .env
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Project Structure

```
lrg-tax-copilot/
├── backend/          # Express API server
│   ├── src/
│   │   ├── config/       # Environment and app configuration
│   │   ├── types/        # TypeScript type definitions
│   │   ├── services/     # Business logic (Claude, Notion, auth)
│   │   ├── middleware/    # Express middleware (auth)
│   │   ├── routes/       # API route handlers
│   │   └── prompts/      # System prompt templates
│   └── database/         # SQLite database files
├── frontend/         # Next.js frontend
│   └── src/
│       ├── app/          # Next.js app router pages
│       ├── components/   # React components
│       └── lib/          # Utilities and API client
└── README.md
```
