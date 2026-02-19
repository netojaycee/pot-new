import Image from "next/image";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="w-full min-h-screen h-full flex flex-col lg:flex-row items-stretch">
        {/* Form Section */}
        <div className="w-full lg:w-1/2 px-4 sm:px-6 lg:px-12 py-8 lg:py-0 flex items-center justify-center">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* Image Section - Hidden on mobile, visible on desktop */}
        <div className="hidden lg:block lg:w-1/2 relative">
          <Image
            src="/auth-screen.png"
            alt="Authentication"
            fill
            className="object-cover w-full h-full"
            priority
          />
        </div>
      </div>
    </div>
  );
}
