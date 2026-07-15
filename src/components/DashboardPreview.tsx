const DashboardPreview = () => {
  return (
    <div className="-mt-8 relative z-10 animate-fade-in-delayed max-w-7xl mx-auto">
      <div className="relative rounded-2xl border border-white/10 bg-white/5 p-2 backdrop-blur-sm shadow-2xl lg:rounded-3xl">
        <img
          src="https://cdn.prod.website-files.com/65783e649367bc55fecaea2d/689c9b4cd2669981b41d134c_Web%20Layout.webp"
          alt="App Dashboard"
          className="w-full rounded-xl lg:rounded-2xl shadow-sm"
        />
        {/* Glow effect */}
        <div className="absolute -inset-4 -z-10 bg-gradient-to-r from-primary/20 to-accent/20 blur-3xl opacity-40" />
      </div>
    </div>
  );
};

export default DashboardPreview;


