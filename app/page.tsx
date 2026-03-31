import { HeroScroll } from "@/components/website/HeroScroll";
import { HomeNavbar } from "@/components/website/HomeNavbar";
import { Announcements } from "@/components/website/Announcements";
import { Footer } from "@/components/website/Footer";
import { WhatWeDo } from "@/components/website/WhatWeDo";
import { Preloader } from "@/components/ui/Preloader";
import dynamic from "next/dynamic";

// Lazy load heavy interactive components below the fold
const Impact = dynamic(() => import("@/components/website/Impact").then(mod => mod.Impact));
const Events = dynamic(() => import("@/components/website/Events").then(mod => mod.Events));
const Programs = dynamic(() => import("@/components/website/Programs").then(mod => mod.Programs));
const GetInvolved = dynamic(() => import("@/components/website/GetInvolved").then(mod => mod.GetInvolved));

function SectionDivider() {
  return (
    <div className="flex items-center justify-center py-4">
      <div className="w-24 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white antialiased selection:bg-white selection:text-black">
      <Preloader />
      <HomeNavbar />
      <div className="flex flex-col">
        <HeroScroll />

        <section id="impact" aria-label="Our Impact">
          <Impact />
        </section>

        <SectionDivider />

        <section id="announcements" aria-label="Latest Updates">
          <Announcements />
        </section>

        <SectionDivider />

        <section id="events" aria-label="Upcoming Events">
          <Events />
        </section>

        <SectionDivider />

        <section id="what-we-do" aria-label="Our Mission">
          <WhatWeDo />
        </section>

        <SectionDivider />

        <section id="programs" aria-label="Accelerator Programs">
          <Programs />
        </section>

        <SectionDivider />

        <section id="get-involved" aria-label="Join Community">
          <GetInvolved />
        </section>

        <Footer />
      </div>
    </main>
  );
}
