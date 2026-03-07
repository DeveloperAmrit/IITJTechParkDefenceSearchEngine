"use client";

import React from "react";
import { BookOpen, FolderKanban, User } from "lucide-react";

interface SearchResult {
  professor_id: string;
  professor_name: string;
  type: string;
  title: string;
  text?: string;
  score: number;
}

interface SourceCardProps {
  result: SearchResult;
}

export default function SourceCard({ result }: SourceCardProps) {
  const getIcon = () => {
    switch (result.type) {
      case "publication":
        return <BookOpen size={12} />;
      case "project":
        return <FolderKanban size={12} />;
      default:
        return <User size={12} />;
    }
  };

  const getTagClass = () => {
    switch (result.type) {
      case "publication":
        return "source-tag source-tag-publication";
      case "project":
        return "source-tag source-tag-project";
      default:
        return "source-tag source-tag-overview";
    }
  };

  return (
    <div className="flex-shrink-0 w-48 bg-chat-input border border-chat-border/40 rounded-xl p-3 hover:border-chat-border transition-colors cursor-default">
      <div className="flex items-start gap-2 mb-2">
        <span className={getTagClass()}>
          {getIcon()}
          {result.type}
        </span>
      </div>
      <p className="text-xs font-medium text-chat-text line-clamp-2 mb-1">
        {result.title}
      </p>
      <p className="text-xs text-chat-text-secondary truncate">
        {result.professor_name}
      </p>
      <div className="mt-2 flex items-center gap-1">
        <div className="h-1 flex-1 bg-chat-border/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-chat-accent rounded-full"
            style={{ width: `${Math.min(result.score * 100, 100)}%` }}
          />
        </div>
        <span className="text-[10px] text-chat-text-secondary">
          {(result.score * 100).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}
