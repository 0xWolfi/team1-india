"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Eye, Edit3, Columns2 } from "lucide-react";

type ViewMode = "edit" | "preview" | "split";

interface MarkdownEditorProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
  /** Called when the user clicks one of the view-mode tabs. */
  defaultMode?: ViewMode;
}

/**
 * Lightweight markdown textarea + live preview, used by the run editor for
 * theme description, sponsors, FAQ, and per-track descriptions.
 *
 * Three modes: Edit (textarea only), Preview (rendered only), Split (both
 * side-by-side). Uses the `react-markdown` already in the dependency tree.
 */
export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 12,
  defaultMode = "split",
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<ViewMode>(defaultMode);

  const showEditor = mode === "edit" || mode === "split";
  const showPreview = mode === "preview" || mode === "split";

  return (
    <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-950 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 border-b border-black/5 dark:border-white/5 bg-black/[0.02] dark:bg-white/[0.02]">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
          Markdown
        </span>
        <div className="inline-flex items-center gap-0.5 p-0.5 rounded-md border border-black/10 dark:border-white/10 bg-white dark:bg-zinc-900">
          <ModeBtn current={mode} value="edit" onClick={setMode}>
            <Edit3 className="w-3 h-3" /> Edit
          </ModeBtn>
          <ModeBtn current={mode} value="split" onClick={setMode}>
            <Columns2 className="w-3 h-3" /> Split
          </ModeBtn>
          <ModeBtn current={mode} value="preview" onClick={setMode}>
            <Eye className="w-3 h-3" /> Preview
          </ModeBtn>
        </div>
      </div>

      <div className={`grid ${mode === "split" ? "md:grid-cols-2" : "grid-cols-1"}`}>
        {showEditor && (
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={rows}
            spellCheck={false}
            className="w-full px-4 py-3 bg-transparent text-sm text-black dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 font-mono leading-relaxed focus:outline-none resize-y border-r border-black/5 dark:border-white/5 last:border-r-0"
          />
        )}
        {showPreview && (
          <div className="px-4 py-3 prose prose-sm dark:prose-invert max-w-none overflow-auto">
            {value.trim() ? (
              <ReactMarkdown>{value}</ReactMarkdown>
            ) : (
              <p className="text-zinc-400 dark:text-zinc-600 italic">Nothing to preview yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ModeBtn({
  current,
  value,
  onClick,
  children,
}: {
  current: ViewMode;
  value: ViewMode;
  onClick: (m: ViewMode) => void;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest transition-colors ${
        active
          ? "bg-red-500 text-white"
          : "text-zinc-500 hover:text-black dark:hover:text-white"
      }`}
    >
      {children}
    </button>
  );
}
