'use client'
import { auth } from "../../../auth";
import NotAdmin from "@/components/NotAdmin";
import NavBar from "@/components/ui/NavBar";

export default async function Page() {
  const session = await auth();

  if (session?.user?.role === "ADMIN") {
    return (
      <>
        <NavBar />
        <div className="min-h-screen flex flex-col items-center justify-center">
          <h1 className="text-3xl">Admin Dashboard</h1>
          <p className="mt-4 text-lg">Welcome, {session.user.name}</p>
        </div>
      </>
    );
  }
  return <NotAdmin />;
}
