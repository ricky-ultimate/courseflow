import { SignInButton } from "@/components/ui/SignInButton";

export default function SignInPage() {
  return (
    <div className="bg-black/95  h-screen flex items-center justify-center">
      <div className="flex flex-col mx-10 justify-center items-center w-full md:w-1/2 p-8 bg-green/30 rounded-md">
        <h2 className="text-3xl mb-4 text-gray-200">Admin access only!</h2>
        <SignInButton />
      </div>
    </div>
  );
}
