import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import RunDetailsClient from "./RunDetailsClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ month: string }>;
}): Promise<Metadata> {
  const { month } = await params;
  // Lightweight DB read — metadata is rendered server-side once per request.
  // Falls back to a generic title if the run doesn't exist or is upcoming.
  const run = await prisma.speedrunRun
    .findFirst({
      where: { slug: month, deletedAt: null },
      select: { monthLabel: true, theme: true, prizePool: true, status: true },
    })
    .catch(() => null);

  if (!run || run.status === "upcoming") {
    return {
      title: "Speedrun | Team1 India",
      description: "A monthly themed build sprint by Team1 India.",
    };
  }

  const themeLine = run.theme ? `${run.theme} · ${run.monthLabel}` : run.monthLabel;
  const description = `${run.theme ? `Theme: ${run.theme}. ` : ""}${
    run.prizePool ? `Prize: ${run.prizePool}. ` : ""
  }Build solo or in a duo, ship in 14 days, demo IRL.`;

  return {
    title: `${themeLine} — Speedrun | Team1 India`,
    description,
    openGraph: {
      title: `Speedrun ${run.monthLabel}`,
      description,
      type: "website",
      images: [
        {
          url: "/speedrun/hero-statue.png",
          width: 1200,
          height: 630,
          alt: `Speedrun ${run.monthLabel}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Speedrun ${run.monthLabel}`,
      description,
      images: ["/speedrun/hero-statue.png"],
    },
  };
}

export default async function SpeedrunMonthPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  return <RunDetailsClient slug={month} />;
}
