import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { redirect } from "next/navigation";
import { getUserRole } from "@/lib/roles";

export default async function AccessCheckPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.email) {
    redirect("/api/auth/signin?callbackUrl=/access-check");
  }

  const role = await getUserRole(session.user.email);

  switch (role) {
    case 'CORE':
        redirect("/core");
    case 'MEMBER':
        redirect("/member");
    case 'PUBLIC':
    default:
        redirect("/public");
  }

  // Fallback UI (rarely seen)
  return (
    <div className="flex h-screen items-center justify-center text-white">
      <div className="animate-pulse">Checking access rights...</div>
    </div>
  );
}
