import { HeroScroll } from "@/components/website/HeroScroll";
import { Impact } from "@/components/website/Impact";
import { WhatWeDo } from "@/components/website/WhatWeDo";
import { Announcements } from "@/components/website/Announcements";
import { Events } from "@/components/website/Events";
import { Programs } from "@/components/website/Programs";
import { GetInvolved } from "@/components/website/GetInvolved";
import { Footer } from "@/components/website/Footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-transparent text-white antialiased selection:bg-white selection:text-black">
      <div className="flex flex-col">
        <HeroScroll />
        <Announcements />
        <Events />
        <WhatWeDo />
        <Programs />
        <GetInvolved />
        <Footer />
      </div>
    </main>
  );
}
