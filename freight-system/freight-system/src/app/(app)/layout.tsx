import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { DriverSidebar } from "@/components/DriverSidebar";

const ROLE_LABELS: Record<string, string> = {
  admin: "管理者",
  accountant: "會計",
  driver: "司機",
};

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const roleLabel = ROLE_LABELS[session.role] ?? session.role;
  const isDriver = session.role === "driver";

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      {isDriver ? (
        <DriverSidebar userName={session.name} />
      ) : (
        <Sidebar userName={session.name} roleLabel={roleLabel} />
      )}
      <main className="flex-1 p-5 sm:p-6 md:p-8 max-w-6xl w-full">{children}</main>
    </div>
  );
}
