"use client";

import React from "react";
import { Zap } from "lucide-react";

interface SuggestedQueriesProps {
  onSelect: (query: string) => void;
}

const SUGGESTIONS = [
  {
    title: "UAV & Drone Research",
    query: "Which professors are working on UAV and drone technology for defence?",
  },
  {
    title: "Cybersecurity for Defence",
    query: "Tell me about cybersecurity and cryptography research for military applications",
  },
  {
    title: "AI in Defence",
    query: "What machine learning and AI research is being done for defence decision making?",
  },
  {
    title: "Radar & Communication",
    query: "Who is working on radar systems and military satellite communications?",
  },
];

export default function SuggestedQueries({ onSelect }: SuggestedQueriesProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-2xl w-full">
      {SUGGESTIONS.map((suggestion, index) => (
        <button
          key={index}
          onClick={() => onSelect(suggestion.query)}
          className="group flex items-start gap-3 p-3 rounded-xl border border-chat-border/40 hover:border-chat-border hover:bg-chat-hover/50 transition-all text-left"
        >
          <Zap
            size={16}
            className="text-chat-text-secondary mt-0.5 flex-shrink-0 group-hover:text-chat-accent transition-colors"
          />
          <div>
            <p className="text-sm font-medium text-chat-text">
              {suggestion.title}
            </p>
            <p className="text-xs text-chat-text-secondary mt-0.5 line-clamp-2">
              {suggestion.query}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
