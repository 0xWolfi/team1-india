"use client";

import { useState } from "react";
import { applyToProgram } from "@/app/public/actions";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface FormField {
    id: string;
    key: string;
    label: string;
    type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox' | 'email' | 'url' | 'tel';
    required: boolean;
    placeholder?: string;
    options?: string[];
}

export function ApplicationForm({ programId, formSchema = [] }: { programId: string, formSchema?: FormField[] | any[] }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const { data: session, status: sessionStatus } = useSession();

  // Normalize form schema if it comes in legacy object format
  const normalizedSchema: FormField[] = Array.isArray(formSchema) 
    ? formSchema 
    : Object.entries(formSchema || {}).map(([key, label]) => ({
        id: key,
        key,
        label: label as string,
        type: 'text',
        required: true
      }));

  async function handleSubmit(formData: FormData) {
    setStatus("submitting");
    const res = await applyToProgram(programId, formData);
    if (res.success) {
      setStatus("success");
    } else {
      setStatus("error");
      setMessage(res.message);
    }
  }

  if (status === "success") {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-3">
          <CheckCircle className="w-6 h-6 text-emerald-400" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">Application Received</h3>
        <p className="text-zinc-400">We'll be in touch with you shortly.</p>
        <button onClick={() => setStatus("idle")} className="mt-4 text-emerald-400 hover:text-emerald-300 text-sm font-medium">
          Apply again
        </button>
      </div>
    );
  }



  if (sessionStatus === "loading") {
      return <div className="p-8 text-center text-zinc-500">Loading...</div>;
  }

  if (!session) {
      return (
          <div className="bg-zinc-900 border border-white/10 rounded-2xl p-8 text-center">
              <h3 className="text-xl font-bold text-white mb-2">Sign in to Apply</h3>
              <p className="text-zinc-500 text-sm mb-6">You must be logged in to submit an application.</p>
              <Link href={`/auth/signin?callbackUrl=${encodeURIComponent(typeof window !== 'undefined' ? window.location.href : '/public/programs')}`}>
                  <button className="bg-white text-black font-bold py-3 px-6 rounded-xl hover:bg-zinc-200 transition-colors w-full">
                      Sign In
                  </button>
              </Link>
          </div>
      );
  }

  const user = session.user;

  return (
    <form action={handleSubmit} className="bg-zinc-900 border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl shadow-black/50">
      <h3 className="text-xl font-bold text-white mb-2">Apply Now</h3>
      <p className="text-zinc-500 text-sm mb-6">Join this program to accelerate your journey.</p>
      
      {/* Default Fields */}
        <div className="space-y-4 mb-6">
            <div>
            <label htmlFor="name" className="block text-sm font-medium text-zinc-400 mb-1.5">Full Name</label>
            <input 
                type="text" 
                name="name" 
                id="name"
                defaultValue={user?.name || ""}
                placeholder="Enter your full name"
                className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-700" 
                required
            />
            </div>

            <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-1.5">Email Address</label>
            <div className="relative">
                <input 
                    type="email" 
                    name="email" 
                    id="email"
                    defaultValue={user?.email || ""}
                    readOnly
                    className="w-full bg-zinc-950/50 border border-white/5 rounded-lg px-4 py-2.5 text-zinc-400 cursor-not-allowed focus:outline-none" 
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] uppercase font-bold text-zinc-600 bg-zinc-900 px-2 py-0.5 rounded border border-white/5">
                    Verified
                </div>
            </div>
             <p className="text-[10px] text-zinc-600 mt-1.5 ml-1">Email is auto-filled from your login session.</p>
            </div>
        </div>

      {/* Dynamic Fields */}
      {normalizedSchema.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/5 mb-6">
            {normalizedSchema.map((field, idx) => (
                <div key={field.key || field.id || idx}>
                    <label className="block text-sm font-medium text-zinc-400 mb-1.5">
                        {field.label} {field.required && <span className="text-indigo-400">*</span>}
                    </label>
                    
                    {field.type === 'textarea' ? (
                        <textarea 
                            name={field.key}
                            className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-700 min-h-[100px] resize-none text-sm"
                            placeholder={field.placeholder || `Enter response...`}
                            required={field.required}
                        />
                    ) : field.type === 'select' ? (
                        <select
                            name={field.key}
                            className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all text-sm"
                            required={field.required}
                            defaultValue=""
                        >
                            <option value="" disabled>Select an option</option>
                            {field.options?.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                            ))}
                        </select>
                    ) : field.type === 'checkbox' ? (
                        <label className="flex items-center gap-3 p-3 bg-zinc-950/30 rounded-lg border border-white/5 cursor-pointer hover:bg-zinc-900 transition-colors">
                            <input 
                                type="checkbox"
                                name={field.key}
                                className="w-5 h-5 rounded bg-black border-white/20 text-indigo-500 focus:ring-indigo-500 focus:ring-offset-0"
                                required={field.required}
                            />
                            <span className="text-sm text-zinc-300 font-medium">{field.placeholder || "Yes, I agree"}</span>
                        </label>
                    ) : (
                        <input 
                            type={field.type}
                            name={field.key}
                            className="w-full bg-zinc-950/50 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-700 text-sm"
                            placeholder={field.placeholder || `Enter ${field.label}...`}
                            required={field.required}
                        />
                    )}
                </div>
            ))}
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
            <AlertCircle className="w-4 h-4" /> {message}
        </div>
      )}

      <button 
        type="submit" 
        disabled={status === "submitting"}
        className="w-full bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {status === "submitting" ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Submitting...
          </>
        ) : (
          "Submit Application"
        )}
      </button>
    </form>
  );
}
