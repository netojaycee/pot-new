import Footer from "@/components/footer/Footer";
import Header from "@/components/header/Header";
import { ReviewReminderModal } from "@/components/product/ReviewReminderModal";

export default function UserLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex flex-col min-h-screen max-w-8xl mx-auto w-full">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
      <ReviewReminderModal />
    </div>
  );
}
