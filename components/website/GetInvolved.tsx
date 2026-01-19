import React from "react";
import Link from "next/link";

export function GetInvolved() {
  return (
    <section id="involved" className="py-10 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10 flex justify-center">
        <div className="max-w-5xl w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-12 text-center shadow-2xl">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tighter">
            Ready to Make an Impact?
            </h2>
            <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            Join a community of builders, innovators, and change-makers. Whether you are a student, professional, or partner, there is a place for you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/public" className="group px-8 py-4 bg-white text-black text-lg font-bold rounded-xl hover:bg-zinc-200 hover:text-black transition-transform w-full sm:w-auto shadow-lg shadow-white/10 hover:shadow-white/20">
                    <span className="block transition-transform duration-200 group-hover:scale-110">Guidebook</span>
                </Link>
                <Link href="mailto:hello@team1india.com" className="group px-8 py-4 bg-transparent border border-white/20 text-white text-lg font-bold rounded-xl hover:border-white/50 hover:text-zinc-200 transition-transform w-full sm:w-auto">
                    <span className="block transition-transform duration-200 group-hover:scale-110">Contact Us</span>
                </Link>
            </div>
        </div>
      </div>
    </section>
  );
}
