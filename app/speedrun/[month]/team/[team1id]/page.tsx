import TeamPageClient from "./TeamPageClient";

export default async function SpeedrunTeamPage({
  params,
}: {
  params: Promise<{ month: string; team1id: string }>;
}) {
  const { month, team1id } = await params;
  return <TeamPageClient runSlug={month} team1Id={team1id} />;
}
