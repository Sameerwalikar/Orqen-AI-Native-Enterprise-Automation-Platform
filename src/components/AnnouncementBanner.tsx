import { Sparkles, ArrowRight } from "lucide-react";

const AnnouncementBanner = () => {
  return (
    <div className="inline-flex items-center gap-3 px-6 py-3 bg-background border border-border rounded-full shadow-soft hover:shadow-elevation transition-all duration-300 hover:border-primary/30 group cursor-pointer animate-fade-in">
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium text-muted-foreground">
          <span className="text-primary font-semibold">Announcement:</span> $2.6M Seed Round
        </span>
      </div>
      <ArrowRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
    </div>
  );
};

export default AnnouncementBanner;