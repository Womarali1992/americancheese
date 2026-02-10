import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";

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

// Module data with specific colors
const modules = [
  { name: "Projects", desc: "Organize work by site, client, or project type with custom categories.", color: "#6366f1", progress: 100 },
  { name: "Tasks", desc: "Break down projects into actionable items with subtasks and checklists.", color: "#16a34a", progress: 78 },
  { name: "Materials", desc: "Track inventory, orders, quotes, and supplier deliveries.", color: "#ea580c", progress: 45 },
  { name: "Labor", desc: "Log hours, assign crews, and calculate labor costs.", color: "#3b82f6", progress: 62 },
  { name: "Contacts", desc: "Manage contractors, suppliers, and team member info.", color: "#06b6d4", progress: 33 },
  { name: "Calendar", desc: "Schedule tasks, set milestones, and view team availability.", color: "#8b5cf6", progress: 89 },
  { name: "Budgets", desc: "Compare estimates vs actuals with cost breakdowns.", color: "#f97316", progress: 55 },
  { name: "Reports", desc: "Export project summaries and financial reports.", color: "#64748b", progress: 71 },
];

// Mini progress bar in module style
const ModuleProgress = ({ value, color }: { value: number; color: string }) => (
  <div 
    className="w-full h-1 rounded-full overflow-hidden mt-3"
    style={{ backgroundColor: hexToRgba(color, 0.15) }}
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

const ModulesGrid = () => {
  return (
    <section id="modules" className="py-24 md:py-40 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 mesh-gradient opacity-50" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: cubicEase }}
          className="text-center mb-20"
        >
          <span className="section-label">Complete Platform</span>
          <h2 className="heading-section mt-4">
            Every workflow,
            <br />
            <span className="gradient-text">covered</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.name}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: cubicEase }}
              className="group relative rounded-xl overflow-hidden border shadow-card transition-all duration-500 hover:-translate-y-2 hover:shadow-elevated cursor-pointer"
              style={{ 
                backgroundColor: lightenColor(mod.color, 0.94),
                borderColor: hexToRgba(mod.color, 0.2)
              }}
            >
              {/* Top accent bar on hover */}
              <div 
                className="absolute top-0 left-0 right-0 h-1 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"
                style={{ backgroundColor: mod.color }}
              />
              
              <div className="p-5 relative z-10">
                <div className="flex items-start justify-between mb-3">
                  {/* Color dot - app style */}
                  <div 
                    className="w-3 h-3 rounded-sm shadow-sm"
                    style={{ backgroundColor: mod.color }}
                  />
                  <ArrowUpRight 
                    size={16} 
                    className="text-foreground/20 group-hover:text-foreground/60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300" 
                  />
                </div>
                
                <h4 className="font-heading font-semibold text-foreground mb-2 group-hover:translate-x-0.5 transition-transform duration-300">
                  {mod.name}
                </h4>
                <p className="font-body text-sm text-foreground/60 leading-relaxed">
                  {mod.desc}
                </p>
                
                {/* Progress indicator - app style */}
                <ModuleProgress value={mod.progress} color={mod.color} />
                
                {/* Status badge */}
                <div className="mt-3 flex items-center justify-between">
                  <span 
                    className="text-[10px] px-2 py-0.5 rounded font-medium uppercase tracking-wide"
                    style={{ 
                      backgroundColor: hexToRgba(mod.color, 0.12),
                      color: mod.color
                    }}
                  >
                    {mod.progress === 100 ? 'Complete' : mod.progress >= 75 ? 'Almost Done' : 'Active'}
                  </span>
                  <span className="text-[10px] font-medium text-foreground/40">
                    {mod.progress}%
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ModulesGrid;
