import RegistrationStatusClient from "./RegistrationStatusClient";

export default async function SpeedrunRegistrationStatusPage({
  params,
}: {
  params: Promise<{ month: string }>;
}) {
  const { month } = await params;
  return <RegistrationStatusClient runSlug={month} />;
}
