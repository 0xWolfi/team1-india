"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

interface MemberData {
  name: string | null;
  xHandle: string;
}

function getTwitterUrl(handle: string) {
  const clean = handle.replace(/^@/, "").replace(/https?:\/\/(www\.)?(twitter|x)\.com\//, "").split("/")[0].split("?")[0];
  return `https://x.com/${clean}`;
}

function getAvatarUrl(handle: string) {
  const clean = handle.replace(/^@/, "").replace(/https?:\/\/(www\.)?(twitter|x)\.com\//, "").split("/")[0].split("?")[0];
  return `/api/avatar?handle=${encodeURIComponent(clean)}`;
}

function MemberAvatar({ member, index }: { member: MemberData; index: number }) {
  const [imgError, setImgError] = useState(false);
  const clean = member.xHandle.replace(/^@/, "").replace(/https?:\/\/(www\.)?(twitter|x)\.com\//, "").split("/")[0];

  return (
    <motion.a
      href={getTwitterUrl(member.xHandle)}
      target="_blank"
      rel="noopener noreferrer"
      title={member.name || `@${clean}`}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: Math.min(index * 0.03, 1.2),
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group relative shrink-0"
    >
      <div className="w-14 h-14 md:w-16 md:h-16 lg:w-[72px] lg:h-[72px] rounded-full overflow-hidden border-2 border-black/10 dark:border-white/10 transition-all duration-300 group-hover:border-red-500/50 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-red-500/20">
        {!imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={getAvatarUrl(member.xHandle)}
            alt={member.name || `@${clean}`}
            className="w-full h-full object-cover bg-zinc-200 dark:bg-zinc-800"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400 text-lg font-bold">
            {(member.name || clean).charAt(0).toUpperCase()}
          </div>
        )}
      </div>
    </motion.a>
  );
}

export function Members() {
  const [members, setMembers] = useState<MemberData[]>([]);
  const [count, setCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });

  useEffect(() => {
    fetch("/api/public/members")
      .then((res) => res.json())
      .then((data) => {
        if (data.members) {
          setMembers(data.members);
          setCount(data.count);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // Hide section only if API returned zero members
  if (loaded && members.length === 0) return null;

  return (
    <section id="community" className="py-16 md:py-24 bg-[var(--background)] overflow-hidden">
      <div className="max-w-6xl mx-auto px-5 md:px-8" ref={ref}>
        {/* Header */}
        <div className="text-center mb-10 md:mb-14">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-black/5 dark:bg-white/5 text-zinc-600 dark:text-zinc-400 border border-black/5 dark:border-white/5 mb-6"
          >
            {count}+ Members
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl lg:text-7xl font-bold text-black dark:text-white tracking-tight mb-4"
          >
            Team1 is its Members
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-zinc-500 dark:text-zinc-500 text-sm md:text-lg max-w-2xl mx-auto"
          >
            Builders, developers, creators, and community leaders growing the Avalanche ecosystem together.
          </motion.p>
        </div>

        {/* Avatar Grid */}
        {isInView && (
          <div className="flex flex-wrap justify-center gap-3 md:gap-4 max-w-4xl mx-auto">
            {members.map((member, i) => (
              <MemberAvatar key={member.xHandle} member={member} index={i} />
            ))}
          </div>
        )}

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-10 md:mt-14"
        >
          <a
            href="https://t.me/avalanche_hi"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-black dark:bg-white text-white dark:text-black font-semibold text-base transition-all duration-300 hover:bg-red-500 hover:text-white hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:scale-[1.02]"
          >
            Join the Community
          </a>
        </motion.div>
      </div>
    </section>
  );
}
