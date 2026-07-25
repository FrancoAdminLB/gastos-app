import { BottomNav } from "@/components/bottom-nav";
import { Header } from "@/components/header";
import { getCurrentUser } from "@/app/actions/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header userName={user.nombre} />
      <main className="flex-1 pb-24 max-w-lg mx-auto w-full px-4 py-5">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
