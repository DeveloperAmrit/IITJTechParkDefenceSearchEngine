const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface SearchResult {
  professor_id: string;
  professor_name: string;
  type: string;
  title: string;
  text: string;
  score: number;
}

export interface SearchResponse {
  query: string;
  answer: string;
  results: SearchResult[];
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface Professor {
  id: string;
  name: string;
  department: string;
  designation: string;
  specialization: string[];
  email: string;
}

export async function searchQuery(
  query: string,
  chatHistory: ChatMessage[] = [],
  topK: number = 5
): Promise<SearchResponse> {
  const res = await fetch(`${API_BASE}/api/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      top_k: topK,
      chat_history: chatHistory,
      stream: false,
    }),
  });

  if (!res.ok) {
    throw new Error(`Search failed: ${res.statusText}`);
  }

  return res.json();
}

export async function* searchStream(
  query: string,
  chatHistory: ChatMessage[] = [],
  topK: number = 5
): AsyncGenerator<{ type: string; data: any }> {
  const res = await fetch(`${API_BASE}/api/search/stream`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      top_k: topK,
      chat_history: chatHistory,
      stream: true,
    }),
  });

  if (!res.ok) {
    throw new Error(`Stream search failed: ${res.statusText}`);
  }

  const reader = res.body?.getReader();
  if (!reader) throw new Error("No response body");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          yield data;
        } catch {
          // skip invalid JSON
        }
      }
    }
  }
}

export async function fetchProfessors(): Promise<Professor[]> {
  const res = await fetch(`${API_BASE}/api/professors`);
  if (!res.ok) throw new Error("Failed to fetch professors");
  return res.json();
}

export async function checkHealth(): Promise<{
  status: string;
  search_engine: boolean;
  llm_available: boolean;
}> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error("Health check failed");
  return res.json();
}
