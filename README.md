# IIT Jodhpur Tech Park — Defence Research Search Engine

A ChatGPT-style search engine for searching professor research work at IIT Jodhpur's Technology Park. Features **semantic search** with sentence-transformers and **natural language answers** powered by Groq LLM.

![Stack](https://img.shields.io/badge/Next.js-Frontend-black) ![Stack](https://img.shields.io/badge/FastAPI-Backend-009688) ![Stack](https://img.shields.io/badge/Groq-LLM-orange) ![Stack](https://img.shields.io/badge/Sentence--Transformers-Search-blue)

## Features

- 🔍 **Hybrid Search** — Combines semantic (vector) search with keyword matching for best results
- 🤖 **Natural Language Answers** — Groq LLM generates human-readable answers from search results
- 💬 **ChatGPT-like UI** — Conversational interface with streaming responses, sidebar history, and source cards
- 📄 **Offline Data** — Searches through locally stored JSON professor data (no internet needed for search)
- 🔄 **Streaming Responses** — Real-time token-by-token answer generation
- 📊 **Source Attribution** — Shows which publications/projects/profiles matched your query

## Architecture

```
┌─────────────────────┐       ┌──────────────────────────────┐
│   Next.js Frontend  │◄─────►│     FastAPI Backend          │
│   (Port 3000)       │  API  │     (Port 8000)              │
│                     │       │                              │
│  - ChatGPT-like UI  │       │  - Semantic Search Engine    │
│  - Streaming SSE    │       │    (sentence-transformers)   │
│  - Conversation     │       │  - Keyword Search            │
│    history          │       │  - Hybrid Ranking            │
│  - Source cards     │       │  - Groq LLM Integration      │
│  - Markdown render  │       │  - Streaming SSE responses   │
└─────────────────────┘       └──────────────────────────────┘
                                         │
                                         ▼
                              ┌──────────────────────┐
                              │  professors.json     │
                              │  (Offline Data)      │
                              └──────────────────────┘
```

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** and **npm**
- **Groq API Key** (free at [console.groq.com](https://console.groq.com))

## Quick Start

### 1. Clone & Setup Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate   # macOS/Linux
# venv\Scripts\activate    # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
```

### 2. Add Your Groq API Key

Edit `backend/.env`:
```
GROQ_API_KEY=gsk_your_key_here
```

Get a free key at [console.groq.com](https://console.groq.com).

### 3. Start Backend

```bash
cd backend
python main.py
```

The backend will:
1. Download the `all-MiniLM-L6-v2` embedding model (~80MB, first run only)
2. Load professor data from `data/professors.json`
3. Compute embeddings for all data chunks
4. Start the API server at `http://localhost:8000`

### 4. Setup & Start Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend runs at `http://localhost:3000`.

## Data Format

Professor data is stored in `backend/data/professors.json`. Each professor entry:

```json
{
  "id": "prof_001",
  "name": "Dr. Example",
  "department": "Computer Science and Engineering",
  "designation": "Assistant Professor",
  "specialization": ["AI", "Machine Learning"],
  "email": "example@iitj.ac.in",
  "research_summary": "...",
  "publications": [
    {
      "title": "Paper Title",
      "year": 2024,
      "venue": "Conference/Journal Name",
      "abstract": "...",
      "keywords": ["keyword1", "keyword2"]
    }
  ],
  "projects": [
    {
      "title": "Project Name",
      "funding_agency": "DRDO",
      "status": "ongoing",
      "description": "..."
    }
  ]
}
```

### Adding Your Own Data

1. Edit `backend/data/professors.json` with real professor data
2. Restart the backend, or call `POST /api/reload` to refresh without restart

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Health check (search engine + LLM status) |
| `POST` | `/api/search` | Search with NLP answer (non-streaming) |
| `POST` | `/api/search/stream` | Search with streaming SSE answer |
| `GET` | `/api/professors` | List all professors |
| `GET` | `/api/professors/{id}` | Get professor details |
| `POST` | `/api/reload` | Reload data & recompute embeddings |

## Example Queries

- "Which professors work on UAV and drone technology?"
- "Tell me about cybersecurity research for defence"
- "Who has published papers on radar signal processing?"
- "What machine learning projects are funded by DRDO?"
- "Compare the research of Dr. Sharma and Dr. Kumar"

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS, TypeScript |
| Backend | Python, FastAPI, Uvicorn |
| Search | sentence-transformers (all-MiniLM-L6-v2), scikit-learn |
| NLP/LLM | Groq API (Llama 3.3 70B) |
| Data | JSON files (offline) |
