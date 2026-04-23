"use client";

import { useState } from "react";
import { ArrowLeft, Mail, Send } from "lucide-react";
import Link from "next/link";
import { FloatingNav } from "@/components/public/FloatingNav";
import { Footer } from "@/components/website/Footer";

export default function PublicContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "", website: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/public/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { setStatus("sent"); setForm({ name: "", email: "", message: "", website: "" }); }
      else setStatus("error");
    } catch { setStatus("error"); }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <FloatingNav />
      <div className="pt-24 px-6 max-w-2xl mx-auto pb-20">
        <Link href="/public" className="flex items-center gap-2 text-zinc-500 hover:text-black dark:hover:text-white mb-8 transition-colors w-fit text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>

        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 border border-black/10 dark:border-white/10 flex items-center justify-center">
            <Mail className="w-4 h-4 text-zinc-500" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">Contact Us</h1>
        </div>
        <p className="text-zinc-500 text-sm mb-10">Have a question, partnership idea, or just want to say hello? Drop us a message.</p>

        {status === "sent" ? (
          <div className="text-center py-16">
            <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20 inline-block mb-4">
              <Send className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Message Sent!</h2>
            <p className="text-zinc-500 text-sm">We&apos;ll get back to you as soon as possible.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Honeypot — hidden from real users */}
            <input type="text" name="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="hidden" tabIndex={-1} autoComplete="off" />

            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input type="text" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea required rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-transparent resize-none focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white" />
            </div>
            {status === "error" && <p className="text-red-500 text-sm">Something went wrong. Please try again.</p>}
            <button type="submit" disabled={status === "sending"} className="w-full py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
              {status === "sending" ? "Sending..." : "Send Message"}
            </button>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
}
