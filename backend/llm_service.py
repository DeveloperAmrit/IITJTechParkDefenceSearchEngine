"""
LLM service using Groq API for natural language response generation.
"""

from groq import Groq
from config import GROQ_API_KEY, GROQ_MODEL


SYSTEM_PROMPT = """You are an intelligent research assistant for the IIT Jodhpur Technology Park Defence Research Search Engine. 
Your role is to help users find information about professors, their research work, publications, and projects related to defence technology.

When answering:
1. Base your answers ONLY on the provided context from the database. Do not make up information.
2. If the context doesn't contain relevant information, say so clearly.
3. Present information in a clear, organized manner.
4. When mentioning publications, include the title, year, and venue.
5. When mentioning professors, include their name, department, and specialization.
6. If multiple professors are relevant, compare and highlight their respective contributions.
7. Be concise but thorough. Use bullet points and structured formatting where appropriate.
8. If the user asks about something outside the scope of the database, politely redirect them.

Remember: You are searching through offline data about professors at IIT Jodhpur's Tech Park working on defence-related research."""


def create_groq_client() -> Groq:
    """Create a Groq client."""
    if not GROQ_API_KEY:
        raise ValueError(
            "GROQ_API_KEY is not set. Please set it in your .env file. "
            "Get a free API key at https://console.groq.com/"
        )
    return Groq(api_key=GROQ_API_KEY)


def generate_response(
    client: Groq,
    query: str,
    context: str,
    chat_history: list[dict] | None = None,
) -> str:
    """
    Generate a natural language response using Groq LLM.
    
    Args:
        client: Groq client
        query: User's search query
        context: Retrieved context from the search engine
        chat_history: Previous messages in the conversation
    
    Returns:
        Generated response string
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    # Add chat history if provided (last 10 messages to stay within context limits)
    if chat_history:
        for msg in chat_history[-10:]:
            messages.append({
                "role": msg["role"],
                "content": msg["content"],
            })

    # Add the current query with context
    user_message = (
        f"User Query: {query}\n\n"
        f"--- Retrieved Context from Database ---\n{context}\n"
        f"--- End of Context ---\n\n"
        f"Please answer the user's query based on the above context. "
        f"If the context is insufficient, say so."
    )
    messages.append({"role": "user", "content": user_message})

    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.3,
            max_tokens=2048,
            top_p=0.9,
        )
        return response.choices[0].message.content
    except Exception as e:
        return f"Error generating response: {str(e)}"


def generate_response_stream(
    client: Groq,
    query: str,
    context: str,
    chat_history: list[dict] | None = None,
):
    """
    Generate a streaming response using Groq LLM.
    
    Yields chunks of text as they are generated.
    """
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]

    if chat_history:
        for msg in chat_history[-10:]:
            messages.append({
                "role": msg["role"],
                "content": msg["content"],
            })

    user_message = (
        f"User Query: {query}\n\n"
        f"--- Retrieved Context from Database ---\n{context}\n"
        f"--- End of Context ---\n\n"
        f"Please answer the user's query based on the above context. "
        f"If the context is insufficient, say so."
    )
    messages.append({"role": "user", "content": user_message})

    try:
        stream = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=messages,
            temperature=0.3,
            max_tokens=2048,
            top_p=0.9,
            stream=True,
        )
        for chunk in stream:
            if chunk.choices[0].delta.content:
                yield chunk.choices[0].delta.content
    except Exception as e:
        yield f"Error generating response: {str(e)}"
