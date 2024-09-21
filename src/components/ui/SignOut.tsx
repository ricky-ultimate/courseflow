'use client'
import { signOut } from "next-auth/react"

export function SignIn() {

const logout = async () => {
    console.log("Attempting to Logout...");
    try {
      await signOut();
    } catch (error) {
      console.error("Error during sign out: ", error);
    }
  }

  return (
    <div className="bg-black/95  h-screen flex items-center justify-center">
        <div className="flex flex-col mx-10 justify-center items-center w-full md:w-1/2 p-8 bg-green/30 rounded-md">
        <form className="w-auto flex flex-col gap-4" >
          <button
          type="button"
          className="p-3 bg-white rounded-md text-black text-center"
          onClick={logout}>
            Sign Out
          </button>
        </form>
      </div>
  </div>
  )
}
