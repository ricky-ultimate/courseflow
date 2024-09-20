'use client'
import { signIn } from "next-auth/react"

export function SignIn() {
  return (
    <div className="bg-black/95  h-screen flex items-center justify-center">
        <div className="flex flex-col mx-10 justify-center items-center w-full md:w-1/2 p-8 bg-green/30 rounded-md">
        <h2 className="text-3xl mb-4 text-gray-200">Welcome Back!</h2>
        <form className="w-auto flex flex-col gap-4" >
          <button
          type="submit"
          className="p-3 bg-white rounded-md text-black text-center"
          onClick={() => signIn("google",{callbackUrl: "http://localhost3000/admin"})}>
            Log In With Google
          </button>
        </form>
      </div>
  </div>
  )
}
