"use client";

import React, { useState, useEffect } from "react";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { CorePageHeader } from "@/components/core/CorePageHeader";
import { Settings, ToggleLeft, ToggleRight, Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const [settings, setSettings] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const router = useRouter();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch("/api/settings");
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSetting = async (key: string) => {
        const currentValue = settings[key] === "true";
        const newValue = !currentValue; // Toggle
        
        // Optimistic update
        setSettings(prev => ({ ...prev, [key]: String(newValue) }));
        setIsSaving(true);

        try {
            await fetch("/api/settings", {
                method: "POST",
                body: JSON.stringify({ key, value: newValue })
            });
            router.refresh();
        } catch (error) {
            console.error(error);
            // Revert on error
            setSettings(prev => ({ ...prev, [key]: String(currentValue) }));
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <CoreWrapper>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                </div>
            </CoreWrapper>
        );
    }

    return (
        <CoreWrapper>
             <CorePageHeader 
                title="System Settings" 
                description="Manage global configuration and visibility."
                icon={<Settings className="w-5 h-5 text-zinc-200" />}
            />

            <div className="mt-8 space-y-6 max-w-2xl">
                <div className="p-6 bg-zinc-900 border border-white/5 rounded-2xl">
                    <h3 className="text-lg font-bold text-white mb-4">Public Portal Visibility</h3>
                    <div className="space-y-4">
                        <ToggleItem 
                            label="Show Partners Section"
                            description="Toggle the visibility of the 'Partners & Projects' section on the public homepage."
                            isOn={settings["SHOW_PARTNERS_SECTION"] === "true"}
                            onToggle={() => toggleSetting("SHOW_PARTNERS_SECTION")}
                            disabled={isSaving}
                        />
                         <ToggleItem 
                            label="Show Projects Section"
                            description="Toggle the visibility of separate Projects on the public homepage."
                            isOn={settings["SHOW_PROJECTS_SECTION"] === "true"}
                            onToggle={() => toggleSetting("SHOW_PROJECTS_SECTION")}
                            disabled={isSaving}
                        />
                         <ToggleItem 
                            label="Show Member Directory"
                            description="Toggle the visibility of the Community Member list on the public homepage."
                            isOn={settings["SHOW_MEMBER_DIRECTORY"] === "true"}
                            onToggle={() => toggleSetting("SHOW_MEMBER_DIRECTORY")}
                            disabled={isSaving}
                        />
                    </div>
                </div>

                 <div className="p-6 bg-zinc-900 border border-white/5 rounded-2xl opacity-50 pointer-events-none">
                    <h3 className="text-lg font-bold text-white mb-4">Maintenance Mode (Coming Soon)</h3>
                    <div className="space-y-4">
                        <ToggleItem 
                            label="Enable Maintenance Mode"
                            description="Disable public access to the site."
                            isOn={false}
                            onToggle={() => {}}
                            disabled={true}
                        />
                    </div>
                 </div>
            </div>
        </CoreWrapper>
    );
}

function ToggleItem({ label, description, isOn, onToggle, disabled }: any) {
    return (
        <div className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5">
            <div>
                <h4 className="font-bold text-sm text-zinc-200">{label}</h4>
                <p className="text-xs text-zinc-500 max-w-sm mt-1">{description}</p>
            </div>
            <button 
                onClick={onToggle}
                disabled={disabled}
                className={`transition-colors focus:outline-none ${isOn ? 'text-emerald-400' : 'text-zinc-600'}`}
            >
                {isOn ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
            </button>
        </div>
    );
}
