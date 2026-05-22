import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile || profile.role !== "ADMIN") redirect("/dashboard");
  return <>{children}</>;
}
