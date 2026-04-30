import type { Metadata } from "next";
import { Suspense } from "react";
import SpeedrunClient from "./SpeedrunClient";

export const metadata: Metadata = {
  title: "Speedrun — Build Fast. Ship Faster. | Team1 India",
  description:
    "A monthly themed build challenge. Sprint with builders across India. Ship products. Win prizes. Powered by Team1 India.",
  openGraph: {
    title: "Team1 Speedrun — Build Fast. Ship Faster.",
    description:
      "A high-energy sprint for builders, thinkers and doers. Build. Ship. Win.",
    type: "website",
  },
};

// SpeedrunClient uses useSearchParams() to read ?ref= and ?login=. Next.js
// requires that hook to be wrapped in a Suspense boundary so prerender can
// bail to client rendering for the search-params-dependent subtree.
export default function SpeedrunPage() {
  return (
    <Suspense fallback={null}>
      <SpeedrunClient />
    </Suspense>
  );
}
