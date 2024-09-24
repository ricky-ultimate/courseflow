import Image from "next/image";
import { SignInButton } from "./SignInButton";
import { SignOutButton } from "./SignOutButton";
import { useSession } from "next-auth/react";

export default function NavBar() {
  const { data: session, status } = useSession();

  return (
    <>
      <div className="overflow-x-hidden z-[9999]">
        <header
          className="flex flex-row bg-[#2c2c2e] p-4 justify-between border-b-[1.5px] border-b-neutral-800 items-center fixed z-[999] left-0 right-0 top-0 w-full"
        >
          <div className="w-full max-w-6xl flex flex-row justify-between items-center">
            <div className="flex justify-between items-center w-full md:w-auto">
              <Image
                src="/logo.svg"
                alt="Logo"
                width="150"
                height="80"
                className="select-none cursor-pointer"
              />
            </div>
            <div className="flex flex-row items-center space-x-4">
              {status === "authenticated" ? (
                <SignOutButton />
              ) : (
                <SignInButton />
              )}
            </div>
          </div>
        </header>
      </div>
    </>
  );
}
