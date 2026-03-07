import os
from dotenv import load_dotenv

load_dotenv()

# Groq settings
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

# Embedding model (sentence-transformers)
EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "all-MiniLM-L6-v2")

# Data path
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
PROFESSORS_JSON = os.path.join(DATA_DIR, "professors.json")

# CORS
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
