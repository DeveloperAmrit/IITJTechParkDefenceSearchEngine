"""
Search engine with semantic search using sentence-transformers embeddings
and keyword-based fallback.
"""

import numpy as np
from typing import List, Dict, Any, Optional
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

from config import EMBEDDING_MODEL
from data_loader import load_professors, build_all_chunks


class SearchEngine:
    """Hybrid search engine combining semantic search with keyword matching."""

    def __init__(self):
        print(f"Loading embedding model: {EMBEDDING_MODEL}...")
        self.model = SentenceTransformer(EMBEDDING_MODEL)
        print("Embedding model loaded.")

        self.professors = load_professors()
        self.chunks = build_all_chunks(self.professors)
        self.chunk_texts = [c["text"] for c in self.chunks]

        print(f"Computing embeddings for {len(self.chunk_texts)} chunks...")
        self.embeddings = self.model.encode(self.chunk_texts, show_progress_bar=True)
        print("Embeddings computed.")

    def semantic_search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Perform semantic search using cosine similarity of embeddings."""
        query_embedding = self.model.encode([query])
        similarities = cosine_similarity(query_embedding, self.embeddings)[0]

        top_indices = np.argsort(similarities)[::-1][:top_k]

        results = []
        for idx in top_indices:
            chunk = self.chunks[idx].copy()
            chunk["score"] = float(similarities[idx])
            results.append(chunk)

        return results

    def keyword_search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Simple keyword-based search as fallback."""
        query_lower = query.lower()
        query_terms = query_lower.split()

        scored = []
        for i, chunk in enumerate(self.chunks):
            text_lower = chunk["text"].lower()
            # Count how many query terms appear in the text
            score = sum(1 for term in query_terms if term in text_lower)
            # Bonus for exact phrase match
            if query_lower in text_lower:
                score += len(query_terms)
            if score > 0:
                scored.append((i, score))

        scored.sort(key=lambda x: x[1], reverse=True)

        results = []
        for idx, score in scored[:top_k]:
            chunk = self.chunks[idx].copy()
            chunk["score"] = float(score)
            results.append(chunk)

        return results

    def hybrid_search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Combine semantic and keyword search results.
        Semantic search scores are normalized and combined with keyword scores.
        """
        semantic_results = self.semantic_search(query, top_k=top_k * 2)
        keyword_results = self.keyword_search(query, top_k=top_k * 2)

        # Merge results by professor_id + type + title
        combined: Dict[str, Dict[str, Any]] = {}

        for r in semantic_results:
            key = f"{r['professor_id']}_{r['type']}_{r['title']}"
            combined[key] = r.copy()
            combined[key]["semantic_score"] = r["score"]
            combined[key]["keyword_score"] = 0.0

        for r in keyword_results:
            key = f"{r['professor_id']}_{r['type']}_{r['title']}"
            if key in combined:
                combined[key]["keyword_score"] = r["score"]
            else:
                combined[key] = r.copy()
                combined[key]["semantic_score"] = 0.0
                combined[key]["keyword_score"] = r["score"]

        # Normalize keyword scores
        max_kw = max((c["keyword_score"] for c in combined.values()), default=1.0)
        if max_kw == 0:
            max_kw = 1.0

        for key in combined:
            sem = combined[key]["semantic_score"]
            kw = combined[key]["keyword_score"] / max_kw
            # Weighted combination: 70% semantic, 30% keyword
            combined[key]["score"] = 0.7 * sem + 0.3 * kw

        # Sort by combined score
        ranked = sorted(combined.values(), key=lambda x: x["score"], reverse=True)

        return ranked[:top_k]

    def get_professor_by_id(self, prof_id: str) -> Optional[Dict[str, Any]]:
        """Get full professor data by ID."""
        for prof in self.professors:
            if prof["id"] == prof_id:
                return prof
        return None

    def get_context_for_llm(self, query: str, top_k: int = 5) -> str:
        """Get search results formatted as context for the LLM."""
        results = self.hybrid_search(query, top_k=top_k)

        if not results:
            return "No relevant results found in the database."

        context_parts = []
        seen_professors = set()

        for r in results:
            context_parts.append(f"[Relevance: {r['score']:.2f}] {r['text']}")

            # Also include full professor info for top matches
            if r["professor_id"] not in seen_professors and r["score"] > 0.3:
                seen_professors.add(r["professor_id"])
                prof = self.get_professor_by_id(r["professor_id"])
                if prof:
                    context_parts.append(
                        f"\n--- Full Profile: {prof['name']} ---\n"
                        f"Department: {prof['department']}\n"
                        f"Designation: {prof['designation']}\n"
                        f"Email: {prof['email']}\n"
                        f"Specialization: {', '.join(prof.get('specialization', []))}\n"
                        f"Research Summary: {prof.get('research_summary', '')}\n"
                    )

        return "\n\n".join(context_parts)

    def reload_data(self):
        """Reload data and recompute embeddings (e.g., when JSON files are updated)."""
        self.professors = load_professors()
        self.chunks = build_all_chunks(self.professors)
        self.chunk_texts = [c["text"] for c in self.chunks]
        self.embeddings = self.model.encode(self.chunk_texts, show_progress_bar=True)
