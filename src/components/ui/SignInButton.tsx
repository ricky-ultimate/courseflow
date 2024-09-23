"use client";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function SignInButton() {

    const router = useRouter();
    const { data: session } = useSession();
    const googleLogin = async () => {
        try {
          // Initiate the sign-in process with Google
          await signIn("google");
        } catch (error) {
          console.error("Error during sign in: ", error);
        }
      };

      useEffect(() => {
        if (session?.user) {
          // Redirect based on the user's role after signing in
          if (session.user.role === "ADMIN") {
            router.push("/admin");
          } else {
            router.push("/");
          }
        }
      }, [session, router]);

  return (
    <button
      type="button"
      className="p-3 bg-white rounded-md text-black text-center"
      onClick={googleLogin}
    >
      Log In With Google
    </button>
  );
}
