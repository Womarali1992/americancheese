import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import FeaturesGrid from "@/components/landing/FeaturesGrid";
import AppShowcase from "@/components/landing/AppShowcase";
import MaterialShowcase from "@/components/landing/MaterialShowcase";
import ModulesGrid from "@/components/landing/ModulesGrid";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background scroll-smooth">
      <Navbar />
      <Hero />
      <AppShowcase />
      <FeaturesGrid />
      <MaterialShowcase />
      <ModulesGrid />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
