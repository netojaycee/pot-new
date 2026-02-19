import Footer from "@/components/footer/Footer";
import Header from "@/components/header/Header";

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      {/* p-4 md:px-16 md:py-8 */}
      <main className="flex-1 max-w-7xl mx-auto w-full">
        {children}
      </main>
      <Footer />
    </div>
  );
}
