"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useEffect, useState, useMemo } from "react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { Block } from "@blocknote/core";
import { Eye, Edit3, Code } from "lucide-react";
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
    // Sync Logic: Only tracking "Save" updates here.
    // Content state sync happens explicitly on Mode Change to avoid race conditions.
    useEffect(() => {
        if (!editor) return;

        const handleChange = async () => {
            if (editable) {
                // Trigger parent onChange for auto-saving
                onChange(JSON.stringify(editor.document));
            }
        };

        const cleanup = editor.onChange(handleChange);
        return () => {
             if (typeof cleanup === 'function') cleanup();
        };
    }, [editor, editable, onChange]);

    // Initial MD Load (One time only)
    useEffect(() => {
        if (editor && editor.document && !markdownContent) {
            const initMd = async () => {
                 const md = await editor.blocksToMarkdownLossy(editor.document);
                 setMarkdownContent(md);
            };
            initMd();
        }
    }, [editor]); // Run once on editor init

    // Handle Mode Switch
    const handleModeChange = async (newMode: ViewMode) => {
        if (newMode === viewMode) return;
        
        // 1. Markdown -> Write (or Preview)
        if (viewMode === 'markdown' && newMode !== 'markdown') {
            // Parse MD -> Blocks
            const blocks = await editor.tryParseMarkdownToBlocks(markdownContent);
            // Replace ALL existing blocks with new parsed blocks
            editor.replaceBlocks(editor.document, blocks);
            // Trigger save immediately
            onChange(JSON.stringify(blocks)); 
        }

        // 2. Write -> Markdown
        if (newMode === 'markdown') {
            // Blocks -> MD
            // Ensure we capture latest state from editor
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
             {/* Tab Switcher - Right Aligned & Boxy */}
             {editable && (
                 <div className="flex items-center gap-1 p-1 bg-zinc-900/50 backdrop-blur-md border border-white/5 rounded-lg w-fit self-end">
                     <button
                         onClick={() => handleModeChange('write')}
                         className={cn(
                             "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all",
                             viewMode === 'write' ? "bg-zinc-800 text-white shadow-sm border border-white/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                         )}
                     >
                         <Edit3 className="w-3.5 h-3.5" /> Write
                     </button>
                     <button
                         onClick={() => handleModeChange('markdown')}
                         className={cn(
                             "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all",
                             viewMode === 'markdown' ? "bg-zinc-800 text-white shadow-sm border border-white/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                         )}
                     >
                         <Code className="w-3.5 h-3.5" /> Markdown
                     </button>
                     <button
                         onClick={() => handleModeChange('preview')}
                         className={cn(
                             "flex items-center gap-2 px-4 py-1.5 rounded-md text-xs font-semibold transition-all",
                             viewMode === 'preview' ? "bg-zinc-800 text-white shadow-sm border border-white/10" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
                         )}
                     >
                         <Eye className="w-3.5 h-3.5" /> Preview
                     </button>
                 </div>
             )}

            {/* Editor Body - Dotted Border, Dark Grey, Transparent */}
            <div 
                className={cn(
                    "relative min-h-[500px] text-zinc-200 rounded-xl p-4 transition-all",
                    editable ? "border-2 border-dotted border-zinc-800 bg-transparent" : "border-none"
                    // User asked for "dark grey in color and transparent". 
                    // border-zinc-800 is dark grey.
                )} 
                style={{ '--bn-editor-background': 'transparent' } as React.CSSProperties}
            >
                
                {/* 1. WRITE MODE */}
                <div className={cn("transition-opacity duration-300", viewMode === 'write' ? "opacity-100 relative z-10 block" : "opacity-0 absolute inset-0 -z-10 pointer-events-none hidden")}>
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
                    <div className="relative w-full h-full p-4">
                        <textarea
                            value={markdownContent}
                            onChange={(e) => {
                                setMarkdownContent(e.target.value);
                                e.target.style.height = 'auto';
                                e.target.style.height = e.target.scrollHeight + 'px';
                            }}
                            ref={(el) => {
                                if (el) {
                                    el.style.height = 'auto';
                                    el.style.height = el.scrollHeight + 'px';
                                }
                            }}
                            className="w-full min-h-[600px] bg-transparent border-none font-mono text-sm text-zinc-300 focus:outline-none resize-none leading-relaxed overflow-hidden"
                            placeholder="# Write your markdown here..."
                        />
                    </div>
                )}

                {/* 3. PREVIEW MODE */}
                {viewMode === 'preview' && (
                     <div className="relative w-full h-full bg-transparent p-4">
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

                /* Glassy Slash Menu & Suggestion Menus */
                /* Glassy Slash Menu & Main Dropdowns */
                .mantine-Menu-dropdown, 
                .bn-suggestion-menu,
                .bn-slash-menu {
                   background: rgba(24, 24, 27, 0.8) !important;
                   backdrop-filter: blur(24px) saturate(180%) !important;
                   -webkit-backdrop-filter: blur(24px) saturate(180%) !important;
                   border: 1px solid rgba(255, 255, 255, 0.08) !important;
                   border-radius: 12px !important;
                   box-shadow: 0 20px 40px -8px rgba(0, 0, 0, 0.7) !important;
                   padding: 6px !important;
                   overflow-y: auto !important;
                   max-height: 320px !important;
                   min-width: 220px !important; 
                   max-width: 280px !important;
                   display: flex !important;
                   flex-direction: column !important;
                }

                /* Submenus (Horizontal Popouts) */
                .mantine-Menu-submenu,
                .mantine-Menu-dropdown .mantine-Menu-dropdown {
                   background: rgba(24, 24, 27, 0.9) !important;
                   border: 1px solid rgba(255, 255, 255, 0.1) !important;
                   box-shadow: 0 10px 30px -4px rgba(0, 0, 0, 0.8) !important;
                   overflow: visible !important; /* Allow further nesting */
                   margin-left: 8px !important; /* Spacing from parent */
                   animation: fadeIn 0.2s ease-out;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateX(-10px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                /* Items Polish */
                .mantine-Menu-item,
                .bn-suggestion-item {
                   border-radius: 6px !important;
                   color: #9da3ae !important; /* Zinc-400 */
                   transition: all 0.1s ease !important;
                   margin-bottom: 2px !important;
                   padding: 6px 10px !important;
                   font-size: 0.85rem !important;
                   font-weight: 500 !important;
                   display: flex !important;
                   align-items: center !important;
                   gap: 8px !important;
                }

                /* Hover / Selected State */
                .mantine-Menu-item[data-hovered],
                .mantine-Menu-item:hover,
                .bn-suggestion-item[aria-selected="true"],
                .bn-suggestion-item[data-hovered] {
                   background: rgba(255, 255, 255, 0.1) !important;
                   color: #fff !important;
                }

                /* Labels/Groups */
                .mantine-Menu-label {
                    color: #52525b !important; /* Zinc-600 */
                    font-size: 0.7rem !important;
                    text-transform: uppercase !important;
                    letter-spacing: 0.05em !important;
                    padding: 8px 12px 4px !important;
                    font-weight: 600 !important;
                }

                /* Icons in menu */
                .mantine-Menu-item .mantine-Menu-itemIcon,
                .bn-suggestion-item-icon {
                    opacity: 0.6;
                    width: 16px !important;
                    height: 16px !important;
                }
                .mantine-Menu-item[data-hovered] .mantine-Menu-itemIcon,
                .bn-suggestion-item[aria-selected="true"] .bn-suggestion-item-icon {
                    opacity: 1;
                    color: #fff !important;
                }

                /* Floating Text Toolbar (Popover) - HORIZONTAL */
                .mantine-Popover-dropdown {
                    background: rgba(24, 24, 27, 0.85) !important;
                    backdrop-filter: blur(16px) saturate(180%) !important;
                    -webkit-backdrop-filter: blur(16px) saturate(180%) !important;
                    border: 1px solid rgba(255, 255, 255, 0.1) !important;
                    border-radius: 12px !important;
                    box-shadow: 0 15px 35px -5px rgba(0, 0, 0, 0.6) !important;
                    padding: 4px !important;
                    color: white !important;
                    
                    /* Default to horizontal for the toolbar itself */
                    display: flex !important;
                    flex-direction: row !important; 
                    align-items: center !important;
                    gap: 4px !important;
                    min-width: unset !important; /* Allow it to shrink to toolbar size */
                }

                /* BUT... The "Turn Into" Menu (and others) are properly targeted as Menus - VERTICAL */
                .mantine-Menu-dropdown,
                .bn-suggestion-menu,
                .bn-slash-menu {
                    /* ... existing styles ... */
                    display: flex !important;
                    flex-direction: column !important; /* FORCE VERTICAL */
                    gap: 2px !important;
                    min-width: 220px !important; 
                }
                
                /* Toolbar Buttons */
                .mantine-ActionIcon-root {
                    color: #a1a1aa !important;
                    transition: all 0.2s ease !important;
                    border-radius: 6px !important;
                    width: 28px !important;
                    height: 28px !important;
                }
                .mantine-ActionIcon-root:hover {
                    background: rgba(255, 255, 255, 0.1) !important;
                    color: white !important;
                    transform: translateY(-1px);
                }
                
                /* SPECIFIC FIX: If a Popover contains a Menu (nested), force it vertical */
                .mantine-Popover-dropdown:has(.mantine-Menu-item) {
                     flex-direction: column !important;
                     padding: 6px !important;
                     align-items: stretch !important;
                }


                /* Fix Heading Spacing - Zero Gap Mode */
                .bn-block-content h1, 
                .bn-block-content h2, 
                .bn-block-content h3 {
                    margin-top: 0 !important; 
                    margin-bottom: 0 !important;
                    line-height: 1.2 !important;
                    padding-top: 0 !important;
                    padding-bottom: 0 !important;
                }
                
                /* H1 WARNING: Title is H1, blocks should be H2+ */
                .bn-block-content h1 {
                    color: #f87171 !important; /* Red 400 */
                    border-left: 2px solid #f87171 !important;
                    padding-left: 12px !important;
                    background: rgba(248, 113, 113, 0.1);
                    border-radius: 4px;
                    font-size: 1.5em !important; /* Force smaller than Title */
                }
                .bn-block-content h1::after {
                    content: " (Use H2/H3 instead)";
                    font-size: 0.5em;
                    text-transform: uppercase;
                    opacity: 0.7;
                    vertical-align: middle;
                    margin-left: 8px;
                    font-weight: 500;
                    letter-spacing: 0.05em;
                }

                /* Tighter Blocks */
                .bn-block-outer {
                    margin-bottom: 0 !important;
                    margin-top: 0 !important;
                    padding-bottom: 1px !important; /* Tiny breath */
                }
             `}</style>
        </div>
    );
}
