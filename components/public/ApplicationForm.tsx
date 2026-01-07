"use client";

import { useState } from "react";
import { applyToProgram } from "@/app/public/actions";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";

export function ApplicationForm({ programId }: { programId: string }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

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

  return (
    <form action={handleSubmit} className="bg-zinc-900 border border-white/10 rounded-2xl p-6 md:p-8">
      <h3 className="text-xl font-bold text-white mb-2">Apply Now</h3>
      <p className="text-zinc-500 text-sm mb-6">Join this program to accelerate your journey.</p>

      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-400 mb-1.5">Full Name</label>
          <input 
            type="text" 
            name="name" 
            id="name"
            required
            className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-zinc-700" 
            placeholder="Jane Doe"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-zinc-400 mb-1.5">Email Address</label>
          <input 
            type="email" 
            name="email" 
            id="email"
            required
            className="w-full bg-zinc-950 border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 transition-all placeholder:text-zinc-700" 
            placeholder="jane@example.com"
          />
        </div>

        {status === "error" && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
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
      </div>
    </form>
  );
}
