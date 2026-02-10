import { motion } from "framer-motion";
import { Cpu, Code2, Webhook, Bot, Blocks, ArrowUpRight } from "lucide-react";

// Color utilities matching app patterns
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

// Progress bar component
const FeatureProgress = ({ value, color }: { value: number; color: string }) => (
  <div 
    className="w-full h-1.5 rounded-full overflow-hidden"
    style={{ backgroundColor: hexToRgba(color, 0.15) }}
  >
    <motion.div
      initial={{ width: 0 }}
      whileInView={{ width: `${value}%` }}
      viewport={{ once: true }}
      transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="h-full rounded-full"
      style={{ backgroundColor: color }}
    />
  </div>
);

const cards = [
  {
    icon: Cpu,
    title: "Works with AI",
    desc: "Ask Claude or ChatGPT to check your project status, add tasks, or update progress — and it just works. Your AI assistant becomes your project co-pilot.",
    span: "lg:col-span-2 lg:row-span-2",
    variant: "featured" as const,
    color: "#6366f1",
    progress: 100,
    stats: { label: "Status", value: "Live" },
  },
  {
    icon: Code2,
    title: "Connect Anything",
    desc: "Link Site Setups to your other tools and apps with our open API.",
    span: "",
    variant: "tinted" as const,
    color: "#16a34a",
    progress: 100,
    stats: { label: "Integrations", value: "50+" },
  },
  {
    icon: Webhook,
    title: "Auto-Updates",
    desc: "Get notified instantly when tasks change or deadlines approach.",
    span: "",
    variant: "tinted" as const,
    color: "#ea580c",
    progress: 85,
    stats: { label: "Alerts", value: "Real-time" },
  },
  {
    icon: Bot,
    title: "Smart Summaries",
    desc: "AI understands your project structure and gives relevant answers.",
    span: "",
    variant: "tinted" as const,
    color: "#8b5cf6",
    progress: 92,
    stats: { label: "Context", value: "Built-in" },
  },
  {
    icon: Blocks,
    title: "Automation Ready",
    desc: "Set up workflows that run automatically — no coding required.",
    span: "",
    variant: "tinted" as const,
    color: "#06b6d4",
    progress: 78,
    stats: { label: "Workflows", value: "Unlimited" },
  },
];

const cubicEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

const FeaturesGrid = () => {
  return (
    <section id="features" className="py-24 md:py-40 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: cubicEase }}
          className="text-center mb-20"
        >
          <span className="section-label">AI-Powered</span>
          <h2 className="heading-section mt-4">
            Let AI handle
            <br />
            <span className="gradient-text">the busy work</span>
          </h2>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-5">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: cubicEase }}
              className={`group relative rounded-2xl overflow-hidden transition-all duration-500 hover:-translate-y-1 ${card.span}`}
            >
              {card.variant === "featured" ? (
                <div 
                  className="h-full rounded-2xl border overflow-hidden"
                  style={{ 
                    backgroundColor: lightenColor(card.color, 0.94),
                    borderColor: hexToRgba(card.color, 0.2)
                  }}
                >
                  {/* Header section - darker tint */}
                  <div 
                    className="p-8 md:p-10 border-b relative"
                    style={{ 
                      backgroundColor: lightenColor(card.color, 0.85),
                      borderColor: hexToRgba(card.color, 0.25)
                    }}
                  >
                    {/* Large background icon */}
                    <card.icon
                      size={200}
                      className="absolute -right-8 -bottom-8 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity duration-500"
                      strokeWidth={0.5}
                      style={{ color: card.color }}
                    />
                    
                    <div className="relative z-10">
                      <div className="flex items-start gap-4 mb-6">
                        <div 
                          className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg"
                          style={{ backgroundColor: card.color }}
                        >
                          <card.icon size={26} className="text-white" />
                        </div>
                        <div 
                          className="w-3 h-3 rounded-sm mt-2"
                          style={{ backgroundColor: card.color }}
                        />
                      </div>
                      
                      <h3 className="font-heading font-semibold text-2xl md:text-3xl text-foreground mb-3">
                        {card.title}
                      </h3>
                      <p className="body-text text-base max-w-sm">
                        {card.desc}
                      </p>
                    </div>
                  </div>
                  
                  {/* Body section - lighter tint */}
                  <div className="p-8 md:p-10">
                    {/* Stats grid - Material card style */}
                    <div
                      className="grid grid-cols-3 gap-0 rounded-lg overflow-hidden mb-6"
                      style={{ border: `1px solid ${hexToRgba(card.color, 0.2)}` }}
                    >
                      <div
                        className="py-4 text-center border-r"
                        style={{
                          backgroundColor: hexToRgba(card.color, 0.08),
                          borderColor: hexToRgba(card.color, 0.15)
                        }}
                      >
                        <div className="text-[10px] uppercase text-foreground/50 font-medium tracking-wide mb-1">Actions</div>
                        <div className="font-semibold text-lg text-foreground">70+</div>
                      </div>
                      <div
                        className="py-4 text-center border-r"
                        style={{
                          backgroundColor: hexToRgba(card.color, 0.08),
                          borderColor: hexToRgba(card.color, 0.15)
                        }}
                      >
                        <div className="text-[10px] uppercase text-foreground/50 font-medium tracking-wide mb-1">Response</div>
                        <div className="font-semibold text-lg text-foreground">Instant</div>
                      </div>
                      <div
                        className="py-4 text-center"
                        style={{ backgroundColor: hexToRgba(card.color, 0.12) }}
                      >
                        <div className="text-[10px] uppercase text-foreground/50 font-medium tracking-wide mb-1">{card.stats.label}</div>
                        <div className="font-bold text-lg" style={{ color: card.color }}>{card.stats.value}</div>
                      </div>
                    </div>
                    
                    <FeatureProgress value={card.progress} color={card.color} />
                    
                    <div className="mt-6 flex items-center justify-between">
                      <span 
                        className="text-[10px] px-2.5 py-1 rounded-md font-medium uppercase tracking-wide"
                        style={{ 
                          backgroundColor: hexToRgba(card.color, 0.12),
                          color: card.color
                        }}
                      >
                        Works with Claude
                      </span>
                      <div className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all duration-300" style={{ color: card.color }}>
                        Learn more
                        <ArrowUpRight size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div 
                  className="h-full rounded-xl border overflow-hidden transition-all duration-300 hover:shadow-elevated"
                  style={{ 
                    backgroundColor: lightenColor(card.color, 0.94),
                    borderColor: hexToRgba(card.color, 0.2)
                  }}
                >
                  {/* Header */}
                  <div 
                    className="p-5 border-b"
                    style={{ 
                      backgroundColor: lightenColor(card.color, 0.85),
                      borderColor: hexToRgba(card.color, 0.25)
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div 
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: card.color }}
                      >
                        <card.icon size={20} className="text-white" />
                      </div>
                      <div 
                        className="w-2.5 h-2.5 rounded-sm"
                        style={{ backgroundColor: card.color }}
                      />
                    </div>
                    
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-1">
                      {card.title}
                    </h3>
                  </div>
                  
                  {/* Body */}
                  <div className="p-5">
                    <p className="font-body text-sm text-foreground/60 leading-relaxed mb-4">
                      {card.desc}
                    </p>
                    
                    <FeatureProgress value={card.progress} color={card.color} />
                    
                    <div className="mt-4 flex items-center justify-between">
                      <span 
                        className="text-[10px] px-2 py-0.5 rounded font-medium uppercase tracking-wide"
                        style={{ 
                          backgroundColor: hexToRgba(card.color, 0.12),
                          color: card.color
                        }}
                      >
                        {card.stats.value}
                      </span>
                      <ArrowUpRight 
                        size={14} 
                        className="text-foreground/20 group-hover:text-foreground/60 transition-colors duration-300" 
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
