import RegisterClient from "./RegisterClient";

export default async function SpeedrunRegisterPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  return <RegisterClient runSlug={month} />;
}
