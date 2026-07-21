import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import LandingExperience from "@/components/LandingExperience";

const Index = () => {
  return (
    <div className="min-h-screen bg-grid-pattern">
      <Navigation />
      <LandingExperience />
      <Footer />
    </div>
  );
};

export default Index;
