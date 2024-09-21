'use client'
import { signOut } from "next-auth/react"

export function SignOut() {
  return (
    <div className="bg-black/95  h-screen flex items-center justify-center">
        <div className="flex flex-col mx-10 justify-center items-center w-full md:w-1/2 p-8 bg-green/30 rounded-md">
        <form className="w-auto flex flex-col gap-4" >
          <button
          type="button"
          className="p-3 bg-white rounded-md text-black text-center"
          onClick={() => signOut({callbackUrl: "http://localhost:3000"}) }>
            Sign Out
          </button>
        </form>
      </div>
  </div>
  )
}
