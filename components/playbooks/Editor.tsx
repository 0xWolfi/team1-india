
"use client";

import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import { useEffect, useState } from "react";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { Block } from "@blocknote/core";

interface EditorProps {
    initialContent?: string | any[]; // JSON string or Block[]
    editable: boolean;
    onChange: (content: string) => void;
}

export default function Editor({ initialContent, editable, onChange }: EditorProps) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const editor = useCreateBlockNote({
        initialContent: (() => {
            if (!initialContent) return undefined;
            
            // If it's already an array (parsed JSON from API), usage it directly
            if (Array.isArray(initialContent)) {
                return initialContent.length > 0 ? initialContent : undefined;
            }

            // If it's a string, parse it
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
                
                const response = await fetch('/api/upload', {
                    method: 'POST',
                    body: formData,
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.url;
                } else {
                    console.error("Upload failed", await response.text());
                    return "https://via.placeholder.com/1000x400?text=Upload+Failed";
                }
            } catch (error) {
                console.error("Error uploading file:", error);
                return "https://via.placeholder.com/1000x400?text=Error";
            }
        }
    });
 
    // Auto-save debounce effect
    const [lastChange, setLastChange] = useState<number>(0);

    useEffect(() => {
        if (!editor || !editable) return;
        
        const handleChange = () => {
             // Simple debouncing can be handled by parent or here.
             // For now, we just pass the JSON string up.
             if (editable) {
                onChange(JSON.stringify(editor.document));
                setLastChange(Date.now());
             }
        }

        const cleanup = editor.onChange(handleChange);
        
        return () => {
             // If BlockNote returns a cleanup function, call it.
             // Based on types, it usually returns a disposable.
             if (typeof cleanup === 'function') {
                 cleanup();
             }
        };
    }, [editor, editable, onChange]);

    if (!editor) {
        return <div>Loading Editor...</div>;
    }

    const customDarkTheme = {
        colors: {
            editor: {
                text: "#ffffff",
                background: "transparent",
            },
            menu: {
                text: "#ffffff",
                background: "#18181b", // zinc-900
            },
            tooltip: {
                text: "#ffffff",
                background: "#09090b", // zinc-950
            },
            hovered: {
                text: "#ffffff",
                background: "#27272a", // zinc-800
            },
            selected: {
                text: "#ffffff",
                background: "#3f3f46", // zinc-700
            },
            disabled: {
                text: "#71717a",
                background: "transparent",
            },
            shadow: "#000000",
            border: "#27272a", // zinc-800
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
    } as const;

    return (
        <div className="editor-wrapper text-zinc-200" style={{ '--bn-editor-background': 'transparent' } as React.CSSProperties}>
             <BlockNoteView 
                editor={editor} 
                editable={editable}
                theme={customDarkTheme}
                className="min-h-[500px]" 
                slashMenu={false}
                sideMenu={false}
             />
             <style jsx global>{`
                .bn-block-content[data-content-type="heading"] {
                   margin-top: 1.5em;
                   margin-bottom: 0.5em;
                   font-weight: 700;
                }
                /* Custom scrollbar for slash menu if needed */
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
