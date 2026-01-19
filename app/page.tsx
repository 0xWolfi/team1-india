import { HeroScroll } from "@/components/website/HeroScroll";
import { Announcements } from "@/components/website/Announcements";
import { Footer } from "@/components/website/Footer";
import { WhatWeDo } from "@/components/website/WhatWeDo";

import dynamic from "next/dynamic";

// Lazy load heavy interactive components below the fold
const Impact = dynamic(() => import("@/components/website/Impact").then(mod => mod.Impact));
const Events = dynamic(() => import("@/components/website/Events").then(mod => mod.Events));
const Programs = dynamic(() => import("@/components/website/Programs").then(mod => mod.Programs));
const GetInvolved = dynamic(() => import("@/components/website/GetInvolved").then(mod => mod.GetInvolved));

export default function Home() {
  return (
    <main className="min-h-screen bg-transparent text-white antialiased selection:bg-white selection:text-black">
      <div className="flex flex-col">
        <HeroScroll />
        
        <section id="announcements" aria-label="Latest Updates">
          <Announcements />
        </section>

        <section id="events" aria-label="Upcoming Events">
          <Events />
        </section>

        <section id="what-we-do" aria-label="Our Mission">
          <WhatWeDo />
        </section>

        <section id="programs" aria-label="Accelerator Programs">
          <Programs />
        </section>

        <section id="impact" aria-label="Our Impact">
          <Impact />
        </section>

        <section id="get-involved" aria-label="Join Community">
          <GetInvolved />
        </section>

        <Footer />
      </div>
    </main>
  );
}
