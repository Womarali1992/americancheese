import { motion } from "framer-motion";
import { Layers, Zap, Brain, GitBranch, ArrowUpRight, Check } from "lucide-react";
import UISimulator from "./UISimulator";

// Color utilities matching the app patterns
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

const features = [
  {
    icon: Layers,
    title: "Task Categories",
    desc: "Organize work into Structural, Systems, Sheathing, and Finishings phases.",
    color: "#6366f1",
    progress: 100,
    tasks: { done: 8, total: 8 },
  },
  {
    icon: Zap,
    title: "Real-time Updates",
    desc: "Track progress across projects, tasks, and team members instantly.",
    color: "#ea580c",
    progress: 85,
    tasks: { done: 6, total: 7 },
  },
  {
    icon: Brain,
    title: "Cost Tracking",
    desc: "Monitor materials, labor costs, and budgets with detailed breakdowns.",
    color: "#8b5cf6",
    progress: 72,
    tasks: { done: 5, total: 7 },
  },
  {
    icon: GitBranch,
    title: "Team Coordination",
    desc: "Assign tasks, track labor hours, and manage contractor schedules.",
    color: "#16a34a",
    progress: 60,
    tasks: { done: 3, total: 5 },
  },
];

// App-style progress bar
const FeatureProgress = ({ value, color }: { value: number; color: string }) => (
  <div 
    className="w-full h-1.5 rounded-full overflow-hidden"
    style={{ backgroundColor: lightenColor(color, 0.85) }}
  >
    <motion.div
      initial={{ width: 0 }}
      whileInView={{ width: `${value}%` }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="h-full rounded-full"
      style={{ backgroundColor: color }}
    />
  </div>
);

const cubicEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

const ValueProposition = () => {
  return (
    <section className="py-24 md:py-40 relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/30 to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          {/* Left text column */}
          <div>
            <motion.span
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, ease: cubicEase }}
              className="section-label inline-block"
            >
              Why Site Setups
            </motion.span>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: 0.1, ease: cubicEase }}
              className="heading-section mt-5 mb-12"
            >
              Everything in one place,
              <br />
              <span className="gradient-text">nothing falls through</span>
            </motion.h2>

            {/* App-styled feature cards */}
            <div className="space-y-4">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1, ease: cubicEase }}
                  className="group rounded-xl overflow-hidden border transition-all duration-300 hover:shadow-elevated cursor-default"
                  style={{ 
                    backgroundColor: lightenColor(feature.color, 0.94),
                    borderColor: hexToRgba(feature.color, 0.2)
                  }}
                >
                  {/* Header - 12% tint */}
                  <div 
                    className="p-4 border-b flex items-start gap-4"
                    style={{ 
                      backgroundColor: lightenColor(feature.color, 0.85),
                      borderColor: hexToRgba(feature.color, 0.25)
                    }}
                  >
                    <div 
                      className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300"
                      style={{ backgroundColor: feature.color }}
                    >
                      <feature.icon size={20} className="text-white" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div 
                          className="w-2.5 h-2.5 rounded-sm"
                          style={{ backgroundColor: feature.color }}
                        />
                        <h3 className="font-heading font-semibold text-foreground truncate">
                          {feature.title}
                        </h3>
                        <ArrowUpRight 
                          size={14} 
                          className="text-foreground/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ml-auto flex-shrink-0" 
                        />
                      </div>
                      <p className="text-sm text-foreground/60 line-clamp-1">{feature.desc}</p>
                    </div>
                  </div>
                  
                  {/* Body - 8% tint */}
                  <div className="px-4 py-3 flex items-center gap-4">
                    <div className="flex-1">
                      <FeatureProgress value={feature.progress} color={feature.color} />
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-foreground/50">
                      <span>{feature.tasks.done}/{feature.tasks.total} tasks</span>
                      <span 
                        className="px-2 py-0.5 rounded font-medium uppercase tracking-wide text-[10px]"
                        style={{ 
                          backgroundColor: hexToRgba(feature.color, 0.12),
                          color: feature.color
                        }}
                      >
                        {feature.progress}%
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right simulator */}
          <motion.div
            initial={{ opacity: 0, y: 40, rotateX: 10 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 1, ease: cubicEase }}
            style={{ perspective: "1000px" }}
          >
            <UISimulator />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ValueProposition;
