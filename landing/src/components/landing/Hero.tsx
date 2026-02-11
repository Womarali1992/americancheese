import { motion } from "framer-motion";
import { Sparkles, ArrowRight, Play, Layers, Zap, Brain, GitBranch, ArrowUpRight } from "lucide-react";

// Color utilities
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

const cubicEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

const FeatureProgress = ({ value, color }: { value: number; color: string }) => (
  <div
    className="w-full h-1.5 rounded-full overflow-hidden"
    style={{ backgroundColor: lightenColor(color, 0.85) }}
  >
    <motion.div
      initial={{ width: 0 }}
      whileInView={{ width: `${value}%` }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.3, ease: cubicEase }}
      className="h-full rounded-full"
      style={{ backgroundColor: color }}
    />
  </div>
);

const FloatingOrb = ({ className, delay = 0 }: { className: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 1.5, delay }}
    className={`absolute rounded-full pointer-events-none ${className}`}
  />
);

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-20 pb-32 overflow-hidden">
      {/* Mesh gradient background */}
      <div className="absolute inset-0 mesh-gradient" />

      {/* Animated orbs */}
      <FloatingOrb
        className="top-1/4 -left-20 w-[500px] h-[500px] bg-gradient-radial from-primary/20 to-transparent blur-3xl animate-float-slow"
        delay={0}
      />
      <FloatingOrb
        className="top-1/3 -right-32 w-[600px] h-[600px] bg-gradient-radial from-slate-500/15 to-transparent blur-3xl animate-float-slow"
        delay={0.5}
      />
      <FloatingOrb
        className="bottom-0 left-1/3 w-[400px] h-[400px] bg-gradient-radial from-blue-500/10 to-transparent blur-3xl animate-float"
        delay={1}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px),
                           linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left column - Text content */}
          <div className="text-center lg:text-left">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, ease: cubicEase }}
              className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-white/80 backdrop-blur-xl border border-primary/20 shadow-lg shadow-primary/5 mb-10"
            >
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              <span className="font-body text-sm font-semibold bg-gradient-to-r from-primary to-slate-500 bg-clip-text text-transparent">
                The Platform for Makers
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: cubicEase }}
              className="heading-hero max-w-2xl mx-auto lg:mx-0 text-balance"
            >
              Project management
              <br />
              <span className="gradient-text">that actually works</span>
            </motion.h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: cubicEase }}
              className="body-text text-lg md:text-xl max-w-[500px] mx-auto lg:mx-0 mt-8 text-muted-foreground"
            >
              One place for projects, tasks, resources, and progress.
              Designed for teams who ship.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: cubicEase }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mt-10"
            >
              <a
                href="https://app.sitesetups.com/signup"
                className="group relative inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-gradient-to-r from-primary to-slate-500 text-primary-foreground font-body text-base font-semibold shadow-primary-glow hover:shadow-glow transition-all duration-500 hover:scale-105"
              >
                <Sparkles size={18} className="opacity-80" />
                Start Building Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </a>
              <a
                href="https://app.sitesetups.com/login"
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-full bg-white/60 backdrop-blur-xl border border-border hover:border-primary/30 text-foreground font-body text-base font-semibold shadow-card hover:shadow-elevated transition-all duration-300"
              >
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-r from-primary/10 to-slate-500/10 group-hover:from-primary/20 group-hover:to-slate-500/20 transition-colors">
                  <Play size={14} className="text-primary ml-0.5" />
                </span>
                Sign In
              </a>
            </motion.div>
          </div>

          {/* Right column - Feature cards */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: cubicEase }}
            className="space-y-4"
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 + i * 0.1, ease: cubicEase }}
                className="group rounded-xl overflow-hidden border transition-all duration-300 hover:shadow-elevated cursor-default"
                style={{
                  backgroundColor: lightenColor(feature.color, 0.94),
                  borderColor: hexToRgba(feature.color, 0.2)
                }}
              >
                {/* Header */}
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

                {/* Body */}
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
          </motion.div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />
    </section>
  );
};

export default Hero;
