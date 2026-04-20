import { prisma } from "@/lib/prisma";
import Image from "next/image";

interface MemberDisplay {
  id: string;
  name: string;
  image: string;
}

async function getMembers(): Promise<MemberDisplay[]> {
  const communityMembers = await prisma.communityMember.findMany({
    where: {
      deletedAt: null,
      status: "active",
      name: { not: null },
    },
    select: {
      id: true,
      name: true,
      customFields: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const members: MemberDisplay[] = [];
  const seen = new Set<string>();

  for (const m of communityMembers) {
    if (!m.name) continue;

    // Extract image from customFields.profileImage or customFields.image
    const cf = (m.customFields as Record<string, any>) || {};
    const image = cf.profileImage || cf.image;
    if (!image || typeof image !== "string") continue;

    // Deduplicate by name to avoid showing the same person twice
    const key = m.name.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);

    members.push({ id: m.id, name: m.name, image });
  }

  return members;
}

export async function MembersShowcase() {
  const members = await getMembers();

  if (members.length === 0) return null;

  // For the scrolling animation we need enough items to fill the viewport.
  // Duplicate the list once so the CSS animation loops seamlessly.
  const scrollItems = [...members, ...members];
  const scrollItemsReversed = [...[...members].reverse(), ...[...members].reverse()];

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      <div className="text-center mb-10 md:mb-14 px-4">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase bg-red-500/10 text-red-400 border border-red-500/20 mb-5">
          {members.length}+ Members
        </span>
        <h2 className="text-3xl sm:text-5xl md:text-7xl font-bold text-black dark:text-white tracking-tight mb-4">
          Team1 is its Members
        </h2>
        <p className="text-base md:text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Builders, creators, and innovators shipping code, content, and
          communities across India.
        </p>
      </div>

      {/* Row 1 — scrolls left */}
      <div className="relative mb-4 md:mb-6 flex justify-center">
        <div className="flex gap-4 md:gap-6 animate-scroll-left items-center">
          {scrollItems.map((member, i) => (
            <MemberAvatar key={`r1-${member.id}-${i}`} member={member} />
          ))}
        </div>
      </div>

      {/* Row 2 — scrolls right */}
      <div className="relative flex justify-center">
        <div className="flex gap-4 md:gap-6 animate-scroll-right items-center">
          {scrollItemsReversed.map((member, i) => (
            <MemberAvatar key={`r2-${member.id}-${i}`} member={member} />
          ))}
        </div>
      </div>

      {/* Edge fades */}
      <div className="absolute inset-y-0 left-0 w-20 md:w-40 bg-gradient-to-r from-[var(--background)] to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-20 md:w-40 bg-gradient-to-l from-[var(--background)] to-transparent pointer-events-none z-10" />
    </section>
  );
}

function MemberAvatar({ member }: { member: MemberDisplay }) {
  return (
    <div className="flex-shrink-0 group">
      <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full overflow-hidden ring-2 ring-black/5 dark:ring-white/10 group-hover:ring-red-500/40 transition-all duration-300 group-hover:scale-110">
        <Image
          src={member.image}
          alt={member.name}
          fill
          className="object-cover"
          sizes="96px"
        />
      </div>
      <p className="text-[10px] md:text-xs text-center text-zinc-500 mt-2 max-w-[80px] md:max-w-[96px] truncate mx-auto font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        {member.name.split(" ")[0]}
      </p>
    </div>
  );
}
