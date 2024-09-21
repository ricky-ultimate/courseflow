import { SignOut } from "@/components/ui/SignOut";
import { auth } from "../../../auth";

export default async function Page() {
  const session = await auth();

  if (session?.user?.role === "ADMIN") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <SignOut />
        <h1 className="text-3xl">Admin Dashboard</h1>
        <p className="mt-4 text-lg">Welcome, {session.user.name}</p>
      </div>
    );
  }

  if (session?.user?.role){
    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
          <SignOut/>
          <p>You are not authorized to view this page name: {session.user.name} role: {session.user.role}!</p>
        </div>
      );
  }
}
