"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useEffect, useState, useMemo } from "react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { Block } from "@blocknote/core";
import { Eye, FileText, Edit3, Code } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditorProps {
    initialContent?: string | any[]; // JSON string or Block[]
    editable: boolean;
    onChange: (content: string) => void;
}

type ViewMode = 'write' | 'markdown' | 'preview';

export default function Editor({ initialContent, editable, onChange }: EditorProps) {
    const [viewMode, setViewMode] = useState<ViewMode>('write');
    const [markdownContent, setMarkdownContent] = useState<string>("");

    // Initialize Editor
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editor = useCreateBlockNote({
        initialContent: (() => {
            if (!initialContent) return undefined;
            if (Array.isArray(initialContent)) return initialContent.length > 0 ? initialContent : undefined;
            if (typeof initialContent === 'string') {
                try {
                    const parsed = JSON.parse(initialContent);
                    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
                } catch (e) {
                    console.error("Failed to parse initial content", e);
                }
            }
            return undefined;
        })(),
        uploadFile: async (file: File) => {
            try {
                const formData = new FormData();
                formData.append('file', file);
                const response = await fetch('/api/upload', { method: 'POST', body: formData });
                if (response.ok) {
                    const data = await response.json();
                    return data.url;
                }
                return "https://via.placeholder.com/1000x400?text=Upload+Failed";
            } catch (error) {
                return "https://via.placeholder.com/1000x400?text=Error";
            }
        }
    });

    // Sync Logic
    useEffect(() => {
        if (!editor) return;

        const handleChange = async () => {
            if (editable) {
                onChange(JSON.stringify(editor.document));
                // Only sync MD if we are not currently editing MD (prevent loop)
                if (viewMode !== 'markdown') {
                   const md = await editor.blocksToMarkdownLossy(editor.document);
                   setMarkdownContent(md);
                }
            }
        };

        const cleanup = editor.onChange(handleChange);
        return () => {
             if (typeof cleanup === 'function') cleanup();
        };
    }, [editor, editable, onChange, viewMode]);

    // Initial MD Load
    useEffect(() => {
        if (editor && editor.document) {
            editor.blocksToMarkdownLossy(editor.document).then(setMarkdownContent);
        }
    }, [editor]);

    // Handle Mode Switch
    const handleModeChange = async (newMode: ViewMode) => {
        if (newMode === viewMode) return;

        if (viewMode === 'markdown' && newMode !== 'markdown') {
            // Sync Markdown -> Blocks
            const blocks = await editor.tryParseMarkdownToBlocks(markdownContent);
            editor.replaceBlocks(editor.document, blocks);
            onChange(JSON.stringify(blocks)); // Trigger save update
        }

        if (newMode === 'markdown' && viewMode !== 'markdown') {
            // Already synced via useEffect, but ensure fresh
            const md = await editor.blocksToMarkdownLossy(editor.document);
            setMarkdownContent(md);
        }

        setViewMode(newMode);
    };


    if (!editor) return <div>Loading Editor...</div>;

    const customDarkTheme = useMemo(() => ({
        colors: {
            editor: { text: "#ffffff", background: "transparent" },
            menu: { text: "#ffffff", background: "#18181b" },
            tooltip: { text: "#ffffff", background: "#09090b" },
            hovered: { text: "#ffffff", background: "#27272a" },
            selected: { text: "#ffffff", background: "#3f3f46" },
            disabled: { text: "#71717a", background: "transparent" },
            shadow: "#000000",
            border: "#27272a",
            sideMenu: "#18181b",
            highlights: { 
                gray: { text: "#ffffff", background: "#3f3f46" },
                brown: { text: "#ffffff", background: "#43302b" },
                red: { text: "#ffffff", background: "#5c2b29" },
                orange: { text: "#ffffff", background: "#5c3b29" },
                yellow: { text: "#ffffff", background: "#5c4b29" },
                green: { text: "#ffffff", background: "#295c2b" },
                blue: { text: "#ffffff", background: "#293b5c" },
                purple: { text: "#ffffff", background: "#3b295c" },
                pink: { text: "#ffffff", background: "#5c294b" },
            },
        },
        borderRadius: 8,
        fontFamily: "Inter, sans-serif",
    } as const), []);

    return (
        <div className="editor-wrapper flex flex-col gap-4">
             {/* Tab Switcher - Only visible if editable, OR if we want to allow viewing source in view mode? 
                 Let's allow switching in Edit mode. For View mode, maybe just Preview/MD?
                 Actually, simpler: Visible if editable. If not editable, it's just Preview Mode implied (or we can show Tabs if user wants to see MD).
                 Let's show Tabs if editable. If not editable, standard view.
              */}
             {editable && (
                 <div className="flex items-center gap-1 p-1 bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-full w-fit mb-4">
                     <button
                         onClick={() => handleModeChange('write')}
                         className={cn(
                             "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                             viewMode === 'write' ? "bg-zinc-800 text-white shadow-lg border border-white/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                         )}
                     >
                         <Edit3 className="w-3.5 h-3.5" /> Write
                     </button>
                     <button
                         onClick={() => handleModeChange('markdown')}
                         className={cn(
                             "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                             viewMode === 'markdown' ? "bg-zinc-800 text-white shadow-lg border border-white/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                         )}
                     >
                         <Code className="w-3.5 h-3.5" /> Markdown
                     </button>
                     <button
                         onClick={() => handleModeChange('preview')}
                         className={cn(
                             "flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all",
                             viewMode === 'preview' ? "bg-zinc-800 text-white shadow-lg border border-white/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                         )}
                     >
                         <Eye className="w-3.5 h-3.5" /> Preview
                     </button>
                 </div>
             )}

            <div className="relative min-h-[500px] text-zinc-200" style={{ '--bn-editor-background': 'transparent' } as React.CSSProperties}>
                
                {/* 1. WRITE MODE */}
                <div className={cn("transition-opacity duration-300", viewMode === 'write' ? "opacity-100 relative z-10" : "opacity-0 absolute inset-0 -z-10 pointer-events-none")}>
                     <BlockNoteView 
                        editor={editor} 
                        editable={editable}
                        theme={customDarkTheme}
                        className="min-h-[500px]" 
                        slashMenu={true}
                        sideMenu={true}
                     />
                </div>

                {/* 2. MARKDOWN MODE */}
                {viewMode === 'markdown' && (
                    <div className="absolute inset-0 z-10 h-full">
                        <textarea
                            value={markdownContent}
                            onChange={(e) => setMarkdownContent(e.target.value)}
                            className="w-full h-full min-h-[600px] bg-zinc-950/30 border border-white/10 rounded-xl p-6 font-mono text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-white/20 resize-none leading-relaxed"
                            placeholder="# Write your markdown here..."
                        />
                    </div>
                )}

                {/* 3. PREVIEW MODE */}
                {viewMode === 'preview' && (
                     <div className="absolute inset-0 z-10 h-full bg-transparent">
                          {/* We reuse BlockNoteView but non-editable for consistent rendering */}
                          <div className="pointer-events-none select-text">
                            <BlockNoteView 
                                editor={editor} 
                                editable={false}
                                theme={customDarkTheme}
                                className="min-h-[500px]"
                                slashMenu={false}
                                sideMenu={false}
                            />
                          </div>
                     </div>
                )}

             </div>

             <style jsx global>{`
                .bn-block-content[data-content-type="heading"] {
                   margin-top: 1.5em;
                   margin-bottom: 0.5em;
                   font-weight: 700;
                }
                .mantine-ScrollArea-viewport::-webkit-scrollbar {
                  width: 5px;
                }
                .mantine-ScrollArea-viewport::-webkit-scrollbar-thumb {
                  background: #333; 
                  border-radius: 4px;
                }
             `}</style>
        </div>
    );
}
