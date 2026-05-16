import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-background font-sans text-foreground items-stretch">
      <Navbar />
      <main className="flex-auto w-full flex flex-col">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
