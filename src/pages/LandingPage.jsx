import React, { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import HeroSection from "@/components/sections/HeroSection"; 
import InfoCard from "@/components/sections/InfoCard"; 
import Carousel from "@/components/sections/Carousel"; 
import Contact from "@/components/sections/Contact"; 
import Footer from "@/components/sections/Footer"; 
import WelcomeNotif from "@/components/sections/WelcomeNotif"; 
import Navbar from "@/components/sections/Navbar";

export default function LandingPage() {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="relative min-h-screen bg-gray-50 flex flex-col font-sans overflow-x-hidden">
      
      {/* 1. Header / Navigasi */}
      <Navbar />

      {/* 2. Konten Utama */}
      <main className="flex-grow">
        
        {/* Hero Section */}
        <HeroSection />

        {/* Fitur & Info Cards */}
        <InfoCard />

        <section id="news" className="py-24 px-4 bg-white relative">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-4 text-balance">
                Latest <span className="text-teal-600">Updates</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                Stay informed with our latest news, events, and important announcements regarding flood monitoring.
              </p>
            </div>
            {/* Pemanggilan Komponen Carousel */}
            <Carousel />
          </div>
        </section>

        {/* Form Kontak */}
        <Contact />
        
      </main>

      {/* 3. Footer */}
      <Footer />

      {/* 4. Popups / Modals (Akan muncul sesuai logic di dalamnya) */}
      <WelcomeNotif />

      {/* 5. Komponen Tambahan (State-driven): Tombol Scroll to Top */}
      <div 
        className={`fixed bottom-8 right-8 z-[100] transition-all duration-500 ${
          showScrollTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
        }`}
      >
        <button
          onClick={scrollToTop}
          className="p-3 bg-teal-600 text-white rounded-full shadow-xl hover:bg-teal-700 hover:scale-110 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-6 h-6" />
        </button>
      </div>

    </div>
  );
}