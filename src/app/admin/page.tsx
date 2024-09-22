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
    return (
        <div className="min-h-screen flex flex-col items-center justify-center">
            <p>Nice try but you're not authorized to view this page :3</p>
        </div>
    );
}
