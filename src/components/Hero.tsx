import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import AnnouncementBanner from "./AnnouncementBanner";
import Badge from "./Badge";
import RotatingText from "./RotatingText";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import SignIn from "@/pages/SignIn";

const Hero = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showSignInPreview, setShowSignInPreview] = useState(false);

  const handleGetStarted = async (e: React.MouseEvent) => {
    e.preventDefault();
    
    if (isAuthenticated) {
      setIsLoading(true);
      setShowSignInPreview(true);
      
      // Premium loading experience - 5 seconds with sign-in preview in background
      setTimeout(() => {
        navigate('/dashboard');
        setIsLoading(false);
        setShowSignInPreview(false);
      }, 5000);
    } else {
      // Show sign-in preview transition, then navigate
      setShowSignInPreview(true);
      setIsLoading(true);
      
      setTimeout(() => {
        navigate('/sign-in');
        setIsLoading(false);
        setShowSignInPreview(false);
      }, 5000);
    }
  };

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20"
      style={{ zoom: 0.8 }}
    >
      {/* Sign-in Page in Background */}
      <AnimatePresence>
        {showSignInPreview && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="fixed inset-0 z-[9998] overflow-hidden"
            style={{ zoom: 1.25 }}
          >
            <SignIn />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Loading Overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-3 bg-background/70 backdrop-blur-sm"
          >
            <div className="h-9 w-9 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">
              {isAuthenticated ? 'Connecting to dashboard…' : 'Loading…'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-6 lg:px-12 py-20">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Announcement Banner */}
          <div className="flex justify-center">
            <AnnouncementBanner />
          </div>

          {/* Badge */}
          <div className="flex justify-center">
            <Badge text="Combinator" icon="Y" />
          </div>

          {/* Main Headline */}
          <div className="space-y-4 animate-fade-in">
            <h1 className="text-5xl md:text-7xl lg:text-8xl leading-tight tracking-tight">
              <span className="block text-foreground font-light">
              AI Multi-Agent Operator
              </span>
              <span className="block mt-2 text-foreground font-bold">
              To automate workflows that{" "}
                <RotatingText
                  words={["optimize.", "scale.", "deliver."]}
                  interval={3000}
                />
              </span>
            </h1>
          </div>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed animate-fade-in-delayed font-light">
          Deploy autonomous agents that coordinate, execute and complete business operations end-to-end without human overhead.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6 animate-fade-in-delayed">
            <Button
              size="lg"
              className="group relative overflow-hidden bg-gradient-to-r from-gray-600 via-gray-400 to-gray-300 bg-[length:200%_100%] px-8 text-base font-semibold text-white shadow-lg shadow-black/10 transition-all duration-500 hover:bg-[length:100%_100%] hover:shadow-xl hover:shadow-black/15 rounded-lg disabled:opacity-70 disabled:cursor-not-allowed"
              disabled={isLoading}
              onClick={handleGetStarted}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  Get started
                  <svg
                    className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

    </section>
  );
};

export default Hero;
