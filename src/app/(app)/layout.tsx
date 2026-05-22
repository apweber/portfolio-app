import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { ToastProvider } from "@/components/providers/ToastProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar role={profile.role} />
        <div className="flex flex-1 flex-col overflow-hidden">
          <Header name={profile.name} email={profile.email} />
          <main className="flex-1 overflow-y-auto bg-gray-50 p-6">{children}</main>
        </div>
      </div>
    </ToastProvider>
  );
}
