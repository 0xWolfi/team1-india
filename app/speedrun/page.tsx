import type { Metadata } from "next";
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

export default function SpeedrunPage() {
  return <SpeedrunClient />;
}
