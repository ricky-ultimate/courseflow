"use client";
import { useRouter } from "next/navigation";

export default function BackToHomeButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/")}
      className="bg-mocha text-white border border-white p-4 rounded-lg"
    >
      Back to Home
    </button>
  );
};
