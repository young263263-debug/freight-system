import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen w-full">
      <Sidebar userName={session.name} />
      <main className="flex-1 p-6 md:p-8 max-w-6xl">{children}</main>
    </div>
  );
}
