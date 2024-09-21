import { SignOut } from "@/components/ui/SignOut";
export default function Page(){
    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
          <h1 className="text-3xl">Admin Dasboard(?)</h1>
          <p className="mt-4 text-lg">Welcome, admin</p>
          <SignOut />
        </div>
      );
}
