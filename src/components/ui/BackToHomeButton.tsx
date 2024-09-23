"use client";
import { useRouter } from "next/navigation";

export default function BackToHomeButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/")}
      className="p-3 bg-white rounded-md text-black text-center"
    >
      Back to Home
    </button>
  );
};
