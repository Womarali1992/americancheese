import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronDown } from "lucide-react";

// Color utilities matching the app
const lightenColor = (hex: string, amount: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const newR = Math.round(r + (255 - r) * amount);
  const newG = Math.round(g + (255 - g) * amount);
  const newB = Math.round(b + (255 - b) * amount);
  return `rgb(${newR}, ${newG}, ${newB})`;
};

const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Mini Progress Bar
const MiniProgress = ({ value, color, delay = 0 }: { value: number; color: string; delay?: number }) => (
  <div 
    className="w-full h-1.5 rounded-full overflow-hidden"
    style={{ backgroundColor: lightenColor(color, 0.85) }}
  >
    <motion.div
      initial={{ width: 0 }}
      animate={{ width: `${value}%` }}
      transition={{ duration: 1, delay: delay + 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="h-full rounded-full"
      style={{ backgroundColor: color }}
    />
  </div>
);

const categories = [
  { name: "Design", color: "#2563eb", progress: 78, tasks: "7/9" },
  { name: "Backend", color: "#16a34a", progress: 45, tasks: "5/11" },
  { name: "Frontend", color: "#ea580c", progress: 25, tasks: "2/8" },
];

const tier2Items = [
  { name: "Typography", color: "#3b82f6", progress: 100 },
  { name: "Color Tokens", color: "#1e40af", progress: 66 },
];

const tasks = [
  { id: 1, title: "Set up palette", done: true },
  { id: 2, title: "Define spacing", done: true },
  { id: 3, title: "Button variants", done: false },
];

const UISimulator = () => {
  const [activeNav, setActiveNav] = useState(0);
  const [expanded, setExpanded] = useState(true);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNav((prev) => (prev + 1) % 5);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const themeDots = [
    "#2563eb", "#16a34a", "#ea580c", "#3b82f6",
    "#1e40af", "#0369a1", "#64748b", "#9ca3af",
  ];

  return (
    <div className="relative group">
      {/* Glow effect behind card */}
      <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-slate-500/20 to-primary/20 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
      
      <div className="relative bg-white rounded-2xl shadow-elevated overflow-hidden border border-border/50">
        {/* Top bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-gradient-to-r from-muted/30 to-transparent">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive/60 hover:bg-destructive transition-colors cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-module-orange/60 hover:bg-module-orange transition-colors cursor-pointer" />
            <div className="w-3 h-3 rounded-full bg-module-green/60 hover:bg-module-green transition-colors cursor-pointer" />
          </div>
          <div className="flex-1 mx-4 h-7 bg-muted/50 rounded-lg flex items-center px-3">
            <span className="code-text text-xs text-muted-foreground/50">app.sitesetups.io/dashboard</span>
          </div>
        </div>

        {/* Content area */}
        <div className="flex min-h-[380px]">
          {/* Sidebar skeleton */}
          <div className="w-14 border-r border-border bg-muted/20 p-2.5 flex flex-col gap-3 pt-4">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className={`h-2.5 rounded-full transition-all duration-500 ${
                  i === activeNav 
                    ? "bg-gradient-to-r from-primary to-slate-500 w-full scale-110" 
                    : "bg-muted w-3/4"
                }`} 
              />
            ))}
          </div>

          {/* Main content - App-style dashboard */}
          <div className="flex-1 p-4 space-y-4 bg-gradient-to-br from-background to-accent/20">
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className="h-4 bg-muted rounded w-28 shimmer-overlay" />
              <div className="h-4 bg-gradient-to-r from-primary/10 to-slate-500/10 rounded-full px-3 w-14 shimmer-overlay" />
            </div>

            {/* Mini Category Cards Grid */}
            <div className="grid grid-cols-3 gap-2.5">
              {categories.map((cat, i) => (
                <motion.div
                  key={cat.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 + 0.3 }}
                  className="rounded-lg overflow-hidden border transition-all duration-300 hover:shadow-md"
                  style={{ 
                    backgroundColor: lightenColor(cat.color, 0.92),
                    borderColor: hexToRgba(cat.color, 0.2)
                  }}
                >
                  {/* Tier 1 Header */}
                  <div 
                    className="p-2 border-b"
                    style={{ 
                      backgroundColor: lightenColor(cat.color, 0.75),
                      borderColor: hexToRgba(cat.color, 0.25)
                    }}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <div 
                        className="w-2 h-2 rounded-sm"
                        style={{ backgroundColor: cat.color }}
                      />
                      <span className="text-[9px] font-semibold text-foreground truncate">
                        {cat.name}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[8px] text-foreground/50 mb-1">
                      <span>{cat.tasks}</span>
                      <span className="font-medium">{cat.progress}%</span>
                    </div>
                    <MiniProgress value={cat.progress} color={cat.color} delay={i * 0.1} />
                  </div>
                  
                  {/* Tier 2 body - only show for first card */}
                  {i === 0 && (
                    <div 
                      className="p-1.5 space-y-1"
                      style={{ backgroundColor: lightenColor(cat.color, 0.85) }}
                    >
                      {tier2Items.map((t2, j) => (
                        <div 
                          key={t2.name}
                          className="rounded pl-1.5 py-1 pr-1 border-l"
                          style={{ 
                            backgroundColor: lightenColor(t2.color, 0.88),
                            borderColor: t2.color
                          }}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1">
                              <div 
                                className="w-1.5 h-1.5 rounded-sm"
                                style={{ backgroundColor: t2.color }}
                              />
                              <span className="text-[7px] font-medium text-foreground/70 truncate">
                                {t2.name}
                              </span>
                            </div>
                            <span className="text-[7px] text-foreground/50">{t2.progress}%</span>
                          </div>
                          <div 
                            className="w-full h-1 rounded-full overflow-hidden"
                            style={{ backgroundColor: lightenColor(t2.color, 0.9) }}
                          >
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${t2.progress}%` }}
                              transition={{ duration: 0.8, delay: 0.8 + j * 0.1 }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: t2.color }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Material Card Preview */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="rounded-lg overflow-hidden border"
              style={{ 
                backgroundColor: `#2563eb14`,
                borderColor: `#2563eb20`
              }}
            >
              <div 
                className="px-2.5 py-2 border-b flex items-start gap-2"
                style={{ 
                  backgroundColor: `#2563eb1f`,
                  borderColor: `#2563eb40`
                }}
              >
                <div className="w-2 h-2 rounded-sm mt-0.5" style={{ backgroundColor: "#2563eb" }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="px-1 py-0.5 rounded text-[7px] font-medium bg-white/50 uppercase">Active</span>
                    <span className="px-1 py-0.5 rounded text-[7px] font-medium bg-white/40">UI Kit</span>
                  </div>
                  <div className="text-[9px] font-semibold text-foreground truncate">React Components</div>
                  <div className="text-[7px] text-foreground/50">Library</div>
                </div>
              </div>
              <div className="px-2.5 py-2">
                <div className="grid grid-cols-3 gap-0 rounded overflow-hidden text-center mb-2" style={{ border: `1px solid #2563eb26` }}>
                  <div className="py-1" style={{ backgroundColor: `#2563eb14` }}>
                    <div className="text-[6px] uppercase text-foreground/40">Qty</div>
                    <div className="text-[8px] font-semibold">24</div>
                  </div>
                  <div className="py-1 border-x" style={{ backgroundColor: `#2563eb14`, borderColor: `#2563eb26` }}>
                    <div className="text-[6px] uppercase text-foreground/40">Cost</div>
                    <div className="text-[8px] font-semibold">—</div>
                  </div>
                  <div className="py-1" style={{ backgroundColor: `#2563eb1f` }}>
                    <div className="text-[6px] uppercase text-foreground/40">Total</div>
                    <div className="text-[8px] font-bold">—</div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {["#142", "#158"].map((t) => (
                    <span 
                      key={t}
                      className="px-1 py-0.5 rounded text-[7px] font-medium"
                      style={{ backgroundColor: `#2563eb26` }}
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Theme dots */}
        <div className="flex items-center justify-center gap-2.5 py-3 border-t border-border bg-muted/10">
          {themeDots.map((color, i) => (
            <div 
              key={i} 
              className="w-3 h-3 rounded-full transition-transform duration-300 hover:scale-125 cursor-pointer ring-2 ring-transparent hover:ring-white shadow-sm"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        {/* Status bar */}
        <div className="flex items-center gap-4 px-5 py-3 bg-gradient-to-r from-muted/30 to-transparent border-t border-border">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-module-green opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-module-green"></span>
            </span>
            <span className="code-text text-xs text-foreground/60">Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="code-text text-xs px-2 py-1 rounded-md bg-primary/10 text-primary font-medium">ctx:12</span>
            <span className="code-text text-xs px-2 py-1 rounded-md bg-slate-500/10 text-purple-600 font-medium">mod:8</span>
          </div>
          <span className="code-text text-xs text-module-green ml-auto font-medium">✓ Context Generated</span>
        </div>
      </div>
    </div>
  );
};

export default UISimulator;
