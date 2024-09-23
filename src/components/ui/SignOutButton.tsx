"use client";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      type="button"
      className="p-3 bg-white rounded-md text-black text-center"
      onClick={() => signOut({ callbackUrl: "/" })}
    >
      Sign Out
    </button>
  );
}
