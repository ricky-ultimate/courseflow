'use client'
import { signIn } from "next-auth/react"

export function SignIn() {

const googleLogin = async () => {
    console.log("Attempting to sign in with Google...");
    try {
      await signIn("google", { callbackUrl: "http://localhost:3000/admin" });
    } catch (error) {
      console.error("Error during sign in: ", error);
    }
  }

  return (
    <div className="bg-black/95  h-screen flex items-center justify-center">
        <div className="flex flex-col mx-10 justify-center items-center w-full md:w-1/2 p-8 bg-green/30 rounded-md">
        <h2 className="text-3xl mb-4 text-gray-200">Welcome Back!</h2>
        <button
          type="button"
          className="p-3 bg-white rounded-md text-black text-center"
          onClick={googleLogin}>
            Log In With Google
        </button>
      </div>
  </div>
  )
}
