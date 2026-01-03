import React from "react";
import Link from "next/link";

export function GetInvolved() {
  return (
    <section id="involved" className="py-10 relative overflow-hidden">
      <div className="container mx-auto px-6 relative z-10 flex justify-center">
        <div className="max-w-4xl w-full bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 md:p-12 text-center shadow-2xl">
            <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 tracking-tighter">
            Ready to Make an Impact?
            </h2>
            <p className="text-xl text-zinc-400 mb-10 max-w-2xl mx-auto">
            Join a community of builders, innovators, and change-makers. Whether you are a student, professional, or partner, there is a place for you.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/public" className="px-8 py-4 bg-white text-black text-lg font-bold rounded-full hover:bg-zinc-200 transition-colors w-full sm:w-auto shadow-lg shadow-white/10">
                    Guidebook
                </Link>
                <Link href="#contact" className="px-8 py-4 bg-transparent border border-white/20 text-white text-lg font-bold rounded-full hover:bg-white/10 transition-colors w-full sm:w-auto">
                    Contact Us
                </Link>
            </div>
        </div>
      </div>
    </section>
  );
}
