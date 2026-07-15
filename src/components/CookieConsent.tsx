import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cookieService } from '@/lib/utils/cookies';
import { Cookie, ChevronDown, ChevronUp, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CookieConsent = () => {
  const [show, setShow] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
      setIsAnimating(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleAccept = () => {
    cookieService.setConsent(true);
    setIsAnimating(false);
    setTimeout(() => setShow(false), 300);
  };

  const handleReject = () => {
    cookieService.setConsent(false);
    setIsAnimating(false);
    setTimeout(() => setShow(false), 300);
  };

  if (!show) return null;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={isAnimating ? { y: 0, opacity: 1 } : { y: 100, opacity: 0 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none"
        >
          <div className="pointer-events-auto">
            {/* Main banner */}
            <div className="relative border-t border-border/50 bg-card/98 backdrop-blur-xl shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.12)]">
              <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4 lg:gap-6">
                  {/* Left: Icon and Main Message */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Cookie className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-foreground mb-1">
                        We value your privacy
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        We use cookies to enhance your experience, analyze site usage, and assist in our marketing efforts.
                      </p>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto lg:flex-shrink-0">
                    {/* Expand/Collapse Details Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpanded(!expanded)}
                      className="lg:hidden text-xs h-9 px-3"
                    >
                      <Settings className="h-3.5 w-3.5 mr-1.5" />
                      {expanded ? (
                        <>
                          <span>Less</span>
                          <ChevronUp className="h-3.5 w-3.5 ml-1.5" />
                        </>
                      ) : (
                        <>
                          <span>Details</span>
                          <ChevronDown className="h-3.5 w-3.5 ml-1.5" />
                        </>
                      )}
                    </Button>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-1 sm:flex-initial">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReject}
                        className="flex-1 sm:flex-initial sm:px-4 h-9 text-xs sm:text-sm font-medium border-border/60 hover:border-destructive/50 hover:text-destructive hover:bg-destructive/5"
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleAccept}
                        className="flex-1 sm:flex-initial sm:px-6 h-9 text-xs sm:text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft hover:shadow-elevation transition-all"
                      >
                        Accept All
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expandable Details Section */}
                <AnimatePresence>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 pt-4 border-t border-border/50">
                        <div className="grid sm:grid-cols-3 gap-4 text-xs">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              <span className="font-semibold text-foreground">Essential</span>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                              Required for the site to function properly.
                            </p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/70" />
                              <span className="font-semibold text-foreground">Preferences</span>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                              Remember your settings and preferences.
                            </p>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 mb-1.5">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                              <span className="font-semibold text-foreground">Analytics</span>
                            </div>
                            <p className="text-muted-foreground leading-relaxed">
                              Help us understand how visitors interact with our site.
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Desktop Details (always visible on large screens) */}
                <div className="hidden lg:block mt-4 pt-4 border-t border-border/50">
                  <div className="grid grid-cols-3 gap-6 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        <span className="font-semibold text-foreground">Essential cookies</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        Required for the site to function properly.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/70" />
                        <span className="font-semibold text-foreground">Preference cookies</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        Remember your settings and preferences.
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/50" />
                        <span className="font-semibold text-foreground">Analytics cookies</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        Help us understand how visitors interact with our site.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieConsent;

