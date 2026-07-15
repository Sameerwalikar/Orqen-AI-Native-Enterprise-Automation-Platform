interface BadgeProps {
  text: string;
  icon?: string;
}

const Badge = ({ text, icon }: BadgeProps) => {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/50 border border-border rounded-lg animate-fade-in-delayed">
      {icon && (
        <div className="w-5 h-5 flex items-center justify-center bg-primary text-primary-foreground font-bold text-xs rounded">
          {icon}
        </div>
      )}
      <span className="text-sm font-medium text-foreground">Backed by</span>
      <span className="text-sm font-semibold text-foreground">{text}</span>
    </div>
  );
};

export default Badge;