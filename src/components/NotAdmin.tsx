import BackToHomeButton from "./ui/BackToHomeButton";

export default function NotAdmin() {
  return (
    <div className="bg-black/95  h-screen flex items-center justify-center">
      <div className="flex flex-col mx-10 justify-center items-center w-full md:w-1/2 p-8 bg-green/30 rounded-md">
        <p className="text-2xl mb-4 text-gray-200">Nice try but you're not authorized to view this page :3</p>
        <BackToHomeButton/>
      </div>
    </div>
  );
}
