"use client";
import { signIn } from "next-auth/react";

export function SignIn() {
  const googleLogin = async () => {
    console.log("Attempting to sign in with Google...");
    try {
      await signIn("google", { callbackUrl: "http://localhost:3000/admin" });
    } catch (error) {
      console.error("Error during sign in: ", error);
    }
  };

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
