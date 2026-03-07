"use client";

import React from "react";
import { Plus, MessageSquare, Shield, X } from "lucide-react";

interface Conversation {
  id: string;
  title: string;
  messages: any[];
}

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
}

export default function Sidebar({
  conversations,
  activeId,
  isOpen,
  onToggle,
  onSelect,
  onNew,
}: SidebarProps) {
  if (!isOpen) return null;

  return (
    <div className="w-64 bg-chat-sidebar flex flex-col h-full border-r border-chat-border/20">
      {/* Top bar */}
      <div className="flex items-center justify-between p-3">
        <button
          onClick={onToggle}
          className="p-2 hover:bg-chat-hover rounded-lg transition-colors"
          title="Close sidebar"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M9 3v18" />
          </svg>
        </button>
        <button
          onClick={onNew}
          className="p-2 hover:bg-chat-hover rounded-lg transition-colors"
          title="New search"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Conversations list */}
      <div className="flex-1 overflow-y-auto px-2">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-chat-text-secondary">
            <MessageSquare size={24} className="mb-2 opacity-50" />
            <p className="text-xs">No searches yet</p>
          </div>
        ) : (
          <div className="space-y-0.5">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => onSelect(conv.id)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm truncate transition-colors ${
                  activeId === conv.id
                    ? "bg-chat-hover text-chat-text"
                    : "text-chat-text-secondary hover:bg-chat-hover/50 hover:text-chat-text"
                }`}
              >
                {conv.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-chat-border/20">
        <div className="flex items-center gap-2 px-2 py-2">
          <Shield size={16} className="text-chat-accent flex-shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">IIT Jodhpur Tech Park</p>
            <p className="text-xs text-chat-text-secondary truncate">
              Defence Research DB
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
