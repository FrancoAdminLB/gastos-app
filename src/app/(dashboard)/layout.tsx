import { BottomNav } from "@/components/bottom-nav";
import { Header } from "@/components/header";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let userName: string | undefined;
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
  });
  userName = dbUser?.nombre;

  return (
    <div className="flex flex-col min-h-screen">
      <Header userName={userName} />
      <main className="flex-1 pb-24 max-w-lg mx-auto w-full px-4 py-5">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
