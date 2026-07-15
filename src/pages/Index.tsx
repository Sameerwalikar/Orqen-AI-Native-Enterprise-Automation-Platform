import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import DashboardPreview from "@/components/DashboardPreview";

const Index = () => {
  return (
    <div className="min-h-screen bg-grid-pattern" style={{ zoom: 0.9 }}>
      <Navigation />
      <Hero />
      <DashboardPreview />
      <Footer />
    </div>
  );
};

export default Index;
