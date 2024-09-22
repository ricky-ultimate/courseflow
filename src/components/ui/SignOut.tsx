'use client'
import { signOut } from "next-auth/react"

export function SignOut() {
    return (
        <div className="bg-zinc-200 py-1 border-b border-s-zinc-200 fixed w-full z-10 top-0">
            <div className="container">
                <button
                    type="button"
                    className="p-3 bg-black rounded-md text-white text-center"
                    onClick={() => signOut({ callbackUrl: "http://localhost:3000" })}>
                    Sign Out
                </button>
            </div>
        </div>
    )
}
