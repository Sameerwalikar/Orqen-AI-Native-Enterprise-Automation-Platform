import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Twitter, Youtube, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-[#050505] text-white pt-20 pb-10 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-[#ff4d00]/50 to-transparent opacity-30" />
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#ff4d00]/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Grid Pattern Boxes */}
      <div className="absolute top-0 left-0 w-full h-[600px] pointer-events-none z-0">
        <svg className="w-full h-full opacity-[0.15]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="footer-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 4" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#footer-grid)" />
        </svg>
      </div>

      {/* Pre-footer CTA */}
      <div className="container mx-auto px-6 mb-32 text-center relative z-10">
        <div className="mb-8 flex justify-center">
            <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 mb-6">
                <span className="text-[#ff4d00] text-2xl font-bold">❖</span>
            </div>
        </div>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-serif mb-6 tracking-tight">
          Never fall short of <br/>
          <span className="text-white">performance targets</span>
        </h2>
        <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto font-light">
          Getcrux does the heavylifting to bring you insights that keep you ahead
        </p>
        <Button className="bg-[#ff4d00] hover:bg-[#ff4d00]/90 text-white rounded-lg px-8 py-6 text-lg font-medium transition-all hover:scale-105 shadow-[0_0_30px_-10px_rgba(255,77,0,0.5)]">
          Talk to Founders
        </Button>
      </div>

      <div className="container mx-auto px-6 border-t border-white/10 pt-20">
        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-6 gap-12 lg:gap-8">
            {/* Brand */}
            <div className="col-span-2 lg:col-span-2 space-y-6">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-[#ff4d00] via-[#ff4d00]/90 to-[#ff4d00]/70 rounded-xl shadow-lg shadow-[#ff4d00]/20 transition-all duration-300 hover:scale-105 flex-shrink-0"></div>
                    <span className="text-2xl font-bold tracking-tighter text-white">MultiOps</span>
                </div>
                <p className="text-gray-500 text-sm font-medium">
                    AI Creative Strategist
                </p>
                <div className="pt-6 flex gap-8">
                    <div>
                        <div className="text-[10px] uppercase tracking-wider text-gray-600 mb-3 font-semibold">Backed by</div>
                        <div className="flex items-center gap-2 bg-white/5 w-fit px-3 py-2 rounded border border-white/10 hover:border-[#ff4d00]/30 transition-colors cursor-default">
                            <span className="bg-[#ff4d00] text-white text-[10px] font-bold px-1 py-0.5 rounded-sm">Y</span>
                            <span className="text-sm font-semibold text-gray-200">Combinator</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Links */}
            <div className="space-y-6">
                <h3 className="font-semibold text-sm text-white">Product</h3>
                <ul className="space-y-4 text-sm text-gray-500">
                    <li><a href="#" className="hover:text-[#ff4d00] transition-colors">Agents</a></li>
                    <li><a href="#" className="hover:text-[#ff4d00] transition-colors">Pricing</a></li>
                </ul>
            </div>

            <div className="space-y-6">
                <h3 className="font-semibold text-sm text-white">Company</h3>
                <ul className="space-y-4 text-sm text-gray-500">
                    <li><a href="#" className="hover:text-[#ff4d00] transition-colors">Careers</a></li>
                    <li><a href="#" className="hover:text-[#ff4d00] transition-colors">Privacy Policy</a></li>
                    <li><a href="#" className="hover:text-[#ff4d00] transition-colors">Terms of Service</a></li>
                    <li><a href="#" className="hover:text-[#ff4d00] transition-colors">Team</a></li>
                </ul>
            </div>

            <div className="space-y-6">
                <h3 className="font-semibold text-sm text-white">Other Resources</h3>
                <ul className="space-y-4 text-sm text-gray-500">
                    <li><a href="#" className="hover:text-[#ff4d00] transition-colors">Blog</a></li>
                    <li><a href="#" className="hover:text-[#ff4d00] transition-colors">Case Studies</a></li>
                    <li><a href="#" className="hover:text-[#ff4d00] transition-colors">Contact</a></li>
                    <li><a href="#" className="hover:text-[#ff4d00] transition-colors">Help Center</a></li>
                </ul>
            </div>

            {/* Newsletter */}
            <div className="col-span-2 lg:col-span-1 space-y-6">
                <h3 className="font-semibold text-sm text-white">Join our newsletter</h3>
                <div className="space-y-3">
                    <Input 
                        placeholder="Enter your email" 
                        className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-[#ff4d00]/50 h-10" 
                    />
                    <Button size="sm" className="w-full bg-[#ff4d00] hover:bg-[#ff4d00]/90 text-white font-medium">
                        Subscribe
                    </Button>
                </div>
                 <div className="pt-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded border border-[#ff4d00]/20 bg-[#ff4d00]/5">
                        <span className="text-[#ff4d00] text-xs font-bold">🚀 Launch YC</span>
                        <span className="text-gray-500 text-xs border-l border-white/10 pl-2 ml-1">213</span>
                    </div>
                 </div>
            </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-24 pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-gray-600 text-xs font-medium tracking-wide">
                © CRUX TECHNOLOGIES, INC
            </div>
            <div className="flex gap-6">
                <a href="#" className="text-gray-600 hover:text-[#ff4d00] transition-colors"><Twitter size={18} /></a>
                <a href="#" className="text-gray-600 hover:text-[#ff4d00] transition-colors"><Youtube size={18} /></a>
                <a href="#" className="text-gray-600 hover:text-[#ff4d00] transition-colors"><Linkedin size={18} /></a>
            </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
