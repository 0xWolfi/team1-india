import SubmitProjectClient from "./SubmitProjectClient";

export default async function SpeedrunSubmitPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  return <SubmitProjectClient runSlug={month} />;
}
