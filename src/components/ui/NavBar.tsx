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
          className={`flex flex-col md:flex-row bg-[#2c2c2e] p-4 justify-center border-b-[1.5px] border-b-neutral-800 md:items-center space-y-4 md:space-y-0 fixed z-[999] left-0 right-0 top-0`}
        >
          <div className="w-full max-w-3xl flex flex-col md:flex-row md:justify-between space-y-4 md:space-y-0 gap-2">
            <div className=" md:w-auto w-full flex justify-between items-center">
              <Image
                src="/logo.svg"
                alt="Logo"
                width="160"
                height="100"
                className="select-none cursor-pointer"
              />
            </div>
            <div className={`space-x-4 md:flex md:flex-row md:items-center`}>
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
