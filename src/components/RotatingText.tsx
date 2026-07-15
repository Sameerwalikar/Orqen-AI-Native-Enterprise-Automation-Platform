import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface RotatingTextProps {
  words: string[];
  interval?: number;
  className?: string;
}

const RotatingText = ({ 
  words, 
  interval = 3000,
  className 
}: RotatingTextProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (words.length === 0) return;

    const cycleWords = () => {
      if (!mountedRef.current) return;

      // Fade out with smooth animation
      setIsVisible(false);
      
      // After fade out, change word and fade in
      timeoutRef.current = setTimeout(() => {
        if (!mountedRef.current) return;
        
        setCurrentIndex((prev) => (prev + 1) % words.length);
        
        // Use double RAF for smooth transition
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (mountedRef.current) {
              setIsVisible(true);
            }
          });
        });
      }, 600); // Slightly less than transition duration for smoother feel
    };

    // Start cycling after initial delay
    const initialTimer = setTimeout(() => {
      if (!mountedRef.current) return;
      cycleWords();
      
      // Set up interval for subsequent cycles
      intervalRef.current = setInterval(() => {
        if (mountedRef.current) {
          cycleWords();
        }
      }, interval);
    }, interval);

    return () => {
      clearTimeout(initialTimer);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [words.length, interval]);

  if (words.length === 0) return null;

  return (
    <span
      className={cn(
        "inline-block will-change-[opacity,transform]",
        className
      )}
    >
      <span 
        className={cn(
          "inline-block transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]",
          isVisible
            ? "opacity-100 translate-y-0 scale-100" 
            : "opacity-0 -translate-y-2 scale-[0.96]"
        )}
        style={{
          transitionProperty: "opacity, transform",
          transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <span 
          className="bg-clip-text text-transparent bg-gradient-to-r from-[hsl(9,100%,64%)] via-[hsl(0,100%,70%)] to-[hsl(330,100%,70%)]"
          style={{
            backgroundImage: "linear-gradient(to right, hsl(9, 100%, 64%), hsl(0, 100%, 70%), hsl(330, 100%, 70%))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {words[currentIndex]}
        </span>
      </span>
    </span>
  );
};

export default RotatingText;

