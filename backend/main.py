"""
FastAPI backend for the IIT Jodhpur Tech Park Defence Research Search Engine.
"""

import json
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from config import FRONTEND_URL
from search_engine import SearchEngine
from llm_service import create_groq_client, generate_response, generate_response_stream


# ----- Globals -----
search_engine: Optional[SearchEngine] = None
groq_client = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize search engine and Groq client on startup."""
    global search_engine, groq_client
    print("Initializing search engine...")
    search_engine = SearchEngine()
    print("Initializing Groq client...")
    try:
        groq_client = create_groq_client()
        print("Groq client initialized.")
    except ValueError as e:
        print(f"Warning: {e}")
        print("LLM responses will not be available. Search-only mode enabled.")
        groq_client = None
    print("Server ready!")
    yield
    print("Shutting down...")


app = FastAPI(
    title="IIT Jodhpur Tech Park Defence Research Search Engine",
    description="Search through professor research data with NLP-powered responses",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ----- Request/Response Models -----

class SearchRequest(BaseModel):
    query: str
    top_k: int = 5
    chat_history: list[dict] | None = None
    stream: bool = False


class SearchResult(BaseModel):
    professor_id: str
    professor_name: str
    type: str
    title: str
    text: str
    score: float


class SearchResponse(BaseModel):
    query: str
    answer: str
    results: list[SearchResult]


# ----- API Routes -----

@app.get("/")
async def root():
    return {
        "message": "IIT Jodhpur Tech Park Defence Research Search Engine API",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "search_engine": search_engine is not None,
        "llm_available": groq_client is not None,
    }


@app.post("/api/search", response_model=SearchResponse)
async def search(request: SearchRequest):
    """
    Search for professor research data and get an NLP-generated answer.
    """
    if not search_engine:
        raise HTTPException(status_code=503, detail="Search engine not initialized")

    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    # Perform hybrid search
    results = search_engine.hybrid_search(request.query, top_k=request.top_k)

    # Get context for LLM
    context = search_engine.get_context_for_llm(request.query, top_k=request.top_k)

    # Generate NLP answer
    if groq_client:
        answer = generate_response(
            groq_client, request.query, context, request.chat_history
        )
    else:
        answer = (
            "⚠️ LLM is not configured (missing GROQ_API_KEY). "
            "Showing raw search results below.\n\n"
            + context
        )

    return SearchResponse(
        query=request.query,
        answer=answer,
        results=[
            SearchResult(
                professor_id=r["professor_id"],
                professor_name=r["professor_name"],
                type=r["type"],
                title=r["title"],
                text=r["text"],
                score=r["score"],
            )
            for r in results
        ],
    )


@app.post("/api/search/stream")
async def search_stream(request: SearchRequest):
    """
    Search with streaming LLM response.
    """
    if not search_engine:
        raise HTTPException(status_code=503, detail="Search engine not initialized")

    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")

    if not groq_client:
        raise HTTPException(status_code=503, detail="LLM not configured")

    # Perform search and get context
    context = search_engine.get_context_for_llm(request.query, top_k=request.top_k)
    results = search_engine.hybrid_search(request.query, top_k=request.top_k)

    # Build result metadata to send first
    results_data = [
        {
            "professor_id": r["professor_id"],
            "professor_name": r["professor_name"],
            "type": r["type"],
            "title": r["title"],
            "score": r["score"],
        }
        for r in results
    ]

    def event_stream():
        # Send results metadata first
        yield f"data: {json.dumps({'type': 'results', 'data': results_data})}\n\n"

        # Stream the LLM response
        for chunk in generate_response_stream(
            groq_client, request.query, context, request.chat_history
        ):
            yield f"data: {json.dumps({'type': 'chunk', 'data': chunk})}\n\n"

        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(event_stream(), media_type="text/event-stream")


@app.get("/api/professors")
async def list_professors():
    """List all professors."""
    if not search_engine:
        raise HTTPException(status_code=503, detail="Search engine not initialized")

    return [
        {
            "id": p["id"],
            "name": p["name"],
            "department": p["department"],
            "designation": p["designation"],
            "specialization": p["specialization"],
            "email": p["email"],
        }
        for p in search_engine.professors
    ]


@app.get("/api/professors/{professor_id}")
async def get_professor(professor_id: str):
    """Get full professor data by ID."""
    if not search_engine:
        raise HTTPException(status_code=503, detail="Search engine not initialized")

    prof = search_engine.get_professor_by_id(professor_id)
    if not prof:
        raise HTTPException(status_code=404, detail="Professor not found")

    return prof


@app.post("/api/reload")
async def reload_data():
    """Reload professor data and recompute embeddings."""
    if not search_engine:
        raise HTTPException(status_code=503, detail="Search engine not initialized")

    search_engine.reload_data()
    return {"message": "Data reloaded successfully", "chunks": len(search_engine.chunks)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
