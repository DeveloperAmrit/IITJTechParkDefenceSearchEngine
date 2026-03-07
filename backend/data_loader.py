"""
Data loader for professor research data.
Loads JSON files and builds searchable text representations.
"""

import json
from typing import List, Dict, Any
from config import PROFESSORS_JSON


def load_professors() -> List[Dict[str, Any]]:
    """Load professor data from JSON file."""
    with open(PROFESSORS_JSON, "r", encoding="utf-8") as f:
        return json.load(f)


def build_professor_text(prof: Dict[str, Any]) -> str:
    """
    Build a single text representation of a professor's data for embedding & search.
    Combines name, department, specialization, publications, projects, etc.
    """
    parts = []

    parts.append(f"Professor: {prof['name']}")
    parts.append(f"Department: {prof['department']}")
    parts.append(f"Designation: {prof['designation']}")
    parts.append(f"Specialization: {', '.join(prof.get('specialization', []))}")
    parts.append(f"Research Summary: {prof.get('research_summary', '')}")

    for pub in prof.get("publications", []):
        parts.append(
            f"Publication: {pub['title']} ({pub['year']}) - {pub['venue']}. "
            f"Abstract: {pub['abstract']} "
            f"Keywords: {', '.join(pub.get('keywords', []))}"
        )

    for proj in prof.get("projects", []):
        parts.append(
            f"Project: {proj['title']} (funded by {proj['funding_agency']}, {proj['status']}). "
            f"Description: {proj['description']}"
        )

    return "\n".join(parts)


def build_publication_texts(prof: Dict[str, Any]) -> List[Dict[str, str]]:
    """Build individual text chunks per publication, tagged with professor info."""
    chunks = []
    for pub in prof.get("publications", []):
        text = (
            f"Professor {prof['name']} ({prof['department']}) published: "
            f"\"{pub['title']}\" in {pub['venue']} ({pub['year']}). "
            f"Abstract: {pub['abstract']} "
            f"Keywords: {', '.join(pub.get('keywords', []))}."
        )
        chunks.append({
            "text": text,
            "professor_id": prof["id"],
            "professor_name": prof["name"],
            "type": "publication",
            "title": pub["title"],
        })
    return chunks


def build_all_chunks(professors: List[Dict[str, Any]]) -> List[Dict[str, str]]:
    """Build all searchable chunks from the professor data."""
    chunks = []

    for prof in professors:
        # One chunk per professor (overview)
        overview_text = build_professor_text(prof)
        chunks.append({
            "text": overview_text,
            "professor_id": prof["id"],
            "professor_name": prof["name"],
            "type": "overview",
            "title": f"Overview of {prof['name']}",
        })

        # One chunk per publication
        chunks.extend(build_publication_texts(prof))

        # One chunk per project
        for proj in prof.get("projects", []):
            text = (
                f"Professor {prof['name']} ({prof['department']}) is working on project: "
                f"\"{proj['title']}\" funded by {proj['funding_agency']} ({proj['status']}). "
                f"Description: {proj['description']}"
            )
            chunks.append({
                "text": text,
                "professor_id": prof["id"],
                "professor_name": prof["name"],
                "type": "project",
                "title": proj["title"],
            })

    return chunks
