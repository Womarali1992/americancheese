import { motion } from "framer-motion";
import { useState } from "react";
import { ChevronDown, GripVertical, Check, ArrowUpRight } from "lucide-react";

// Utility functions matching the app's color system
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

// App-style Progress Bar
const ProgressBar = ({ value, color }: { value: number; color: string }) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  return (
    <div 
      className="w-full h-2 rounded-full overflow-hidden"
      style={{ backgroundColor: lightenColor(color, 0.85) }}
    >
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${clampedValue}%` }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="h-full rounded-full transition-all duration-300"
        style={{ backgroundColor: color }}
      />
    </div>
  );
};

// Mini Progress Bar for tier2
const MiniProgressBar = ({ value, color }: { value: number; color: string }) => {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  return (
    <div 
      className="w-full h-1.5 rounded-full overflow-hidden"
      style={{ backgroundColor: lightenColor(color, 0.85) }}
    >
      <motion.div
        initial={{ width: 0 }}
        whileInView={{ width: `${clampedValue}%` }}
        viewport={{ once: true }}
        transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="h-full rounded-full"
        style={{ backgroundColor: color }}
      />
    </div>
  );
};

// Status badge component
const StatusBadge = ({ progress, color }: { progress: number; color: string }) => {
  const getStatus = () => {
    if (progress === 100) return "Complete";
    if (progress >= 75) return "Almost Complete";
    if (progress >= 25) return "In Progress";
    return "Not Started";
  };
  
  return (
    <span 
      className="text-[10px] px-2 py-1 rounded-md font-medium uppercase tracking-wide"
      style={{ 
        backgroundColor: hexToRgba(color, 0.15),
        color: 'hsl(var(--foreground))'
      }}
    >
      {getStatus()}
    </span>
  );
};

// Sample data showcasing different project types
const categories = [
  {
    name: "Construction",
    color: "#6366f1",
    progress: 78,
    tasks: { done: 7, total: 9 },
    tier2: [
      {
        name: "Foundation",
        color: "#6366f1",
        progress: 100,
        tasks: { done: 3, total: 3 },
        subtasks: [
          { id: 1, title: "Site preparation", done: true },
          { id: 2, title: "Pour concrete footings", done: true },
          { id: 3, title: "Install rebar", done: true },
        ]
      },
      {
        name: "Framing",
        color: "#4f46e5",
        progress: 66,
        tasks: { done: 2, total: 3 },
        subtasks: [
          { id: 1, title: "Erect wall frames", done: true },
          { id: 2, title: "Install roof trusses", done: true },
          { id: 3, title: "Sheathing complete", done: false },
        ]
      },
      {
        name: "Electrical",
        color: "#4338ca",
        progress: 50,
        tasks: { done: 2, total: 4 },
        subtasks: [
          { id: 1, title: "Run main panel", done: true },
          { id: 2, title: "Wire circuits", done: true },
          { id: 3, title: "Install outlets", done: false },
          { id: 4, title: "Final inspection", done: false },
        ]
      },
    ]
  },
  {
    name: "Design",
    color: "#ec4899",
    progress: 62,
    tasks: { done: 5, total: 8 },
    tier2: [
      {
        name: "Branding",
        color: "#ec4899",
        progress: 100,
        tasks: { done: 3, total: 3 },
        subtasks: [
          { id: 1, title: "Logo concepts", done: true },
          { id: 2, title: "Color palette", done: true },
          { id: 3, title: "Typography system", done: true },
        ]
      },
      {
        name: "UI/UX",
        color: "#db2777",
        progress: 50,
        tasks: { done: 2, total: 4 },
        subtasks: [
          { id: 1, title: "Wireframes", done: true },
          { id: 2, title: "High-fidelity mockups", done: true },
          { id: 3, title: "Prototype", done: false },
          { id: 4, title: "User testing", done: false },
        ]
      },
      {
        name: "Assets",
        color: "#f472b6",
        progress: 0,
        tasks: { done: 0, total: 2 },
        subtasks: [
          { id: 1, title: "Icon set", done: false },
          { id: 2, title: "Illustration pack", done: false },
        ]
      },
    ]
  },
  {
    name: "Fitness",
    color: "#16a34a",
    progress: 45,
    tasks: { done: 5, total: 11 },
    tier2: [
      {
        name: "Strength",
        color: "#16a34a",
        progress: 75,
        tasks: { done: 3, total: 4 },
        subtasks: [
          { id: 1, title: "Upper body day", done: true },
          { id: 2, title: "Lower body day", done: true },
          { id: 3, title: "Core workout", done: true },
          { id: 4, title: "Full body session", done: false },
        ]
      },
      {
        name: "Cardio",
        color: "#15803d",
        progress: 33,
        tasks: { done: 1, total: 3 },
        subtasks: [
          { id: 1, title: "5K run", done: true },
          { id: 2, title: "HIIT session", done: false },
          { id: 3, title: "Cycling", done: false },
        ]
      },
      {
        name: "Recovery",
        color: "#059669",
        progress: 25,
        tasks: { done: 1, total: 4 },
        subtasks: [
          { id: 1, title: "Yoga session", done: true },
          { id: 2, title: "Foam rolling", done: false },
          { id: 3, title: "Stretching routine", done: false },
          { id: 4, title: "Rest day", done: false },
        ]
      },
    ]
  },
  {
    name: "Marketing",
    color: "#ea580c",
    progress: 58,
    tasks: { done: 7, total: 12 },
    tier2: [
      {
        name: "Content",
        color: "#ea580c",
        progress: 80,
        tasks: { done: 4, total: 5 },
        subtasks: [
          { id: 1, title: "Blog post draft", done: true },
          { id: 2, title: "Social media calendar", done: true },
          { id: 3, title: "Email newsletter", done: true },
          { id: 4, title: "Video script", done: true },
          { id: 5, title: "Case study", done: false },
        ]
      },
      {
        name: "Campaigns",
        color: "#f97316",
        progress: 50,
        tasks: { done: 2, total: 4 },
        subtasks: [
          { id: 1, title: "Ad creative", done: true },
          { id: 2, title: "Landing page", done: true },
          { id: 3, title: "A/B testing", done: false },
          { id: 4, title: "Performance report", done: false },
        ]
      },
      {
        name: "Analytics",
        color: "#fb923c",
        progress: 33,
        tasks: { done: 1, total: 3 },
        subtasks: [
          { id: 1, title: "Setup tracking", done: true },
          { id: 2, title: "Dashboard creation", done: false },
          { id: 3, title: "Monthly review", done: false },
        ]
      },
    ]
  },
];

const cubicEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

const CategoryCard = ({ category, index }: { category: typeof categories[0]; index: number }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: cubicEase }}
      className="rounded-xl overflow-hidden shadow-card border transition-all duration-300 hover:shadow-elevated group"
      style={{ 
        backgroundColor: lightenColor(category.color, 0.92),
        borderColor: hexToRgba(category.color, 0.2)
      }}
    >
      {/* Tier 1 Header */}
      <div 
        className="p-4 border-b cursor-pointer"
        style={{ 
          backgroundColor: lightenColor(category.color, 0.75),
          borderColor: hexToRgba(category.color, 0.25)
        }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2.5 mb-2">
          <div 
            className="w-3 h-3 rounded-sm shadow-sm"
            style={{ backgroundColor: category.color }}
          />
          <span className="font-heading font-semibold text-foreground text-base">
            {category.name}
          </span>
          <ArrowUpRight 
            size={14} 
            className="ml-auto opacity-0 group-hover:opacity-60 text-foreground transition-opacity duration-300" 
          />
        </div>
        
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2.5">
          <span>{category.tasks.done} of {category.tasks.total} tasks</span>
          <span className="font-medium text-foreground">{category.progress}%</span>
        </div>
        
        <ProgressBar value={category.progress} color={category.color} />
        
        <div className="mt-3">
          <StatusBadge progress={category.progress} color={category.color} />
        </div>
      </div>

      {/* Tier 2 Body */}
      <motion.div
        initial={false}
        animate={{ height: expanded ? "auto" : 0, opacity: expanded ? 1 : 0 }}
        transition={{ duration: 0.3, ease: cubicEase }}
        className="overflow-hidden"
      >
        <div 
          className="p-4 space-y-3"
          style={{ backgroundColor: lightenColor(category.color, 0.85) }}
        >
          {category.tier2.map((tier2) => (
            <Tier2Item key={tier2.name} tier2={tier2} parentColor={category.color} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

const Tier2Item = ({ tier2, parentColor }: { tier2: typeof categories[0]['tier2'][0]; parentColor: string }) => {
  const [showTasks, setShowTasks] = useState(false);

  return (
    <div
      className="rounded-md pl-3 py-2.5 pr-2.5 border-l-2 cursor-pointer transition-all duration-200 hover:translate-x-0.5"
      style={{
        backgroundColor: lightenColor(parentColor, 0.8),
        borderColor: tier2.color
      }}
    >
      <div
        className="flex items-center justify-between mb-1.5"
        onClick={() => setShowTasks(!showTasks)}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-sm"
            style={{ backgroundColor: tier2.color }}
          />
          <span className="text-xs font-medium text-foreground/80">
            {tier2.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground/60">{tier2.progress}%</span>
          <ChevronDown
            size={12}
            className={`text-foreground/40 transition-transform duration-200 ${showTasks ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      <MiniProgressBar value={tier2.progress} color={tier2.color} />

      <div className="text-[10px] text-foreground/50 mt-1.5">
        {tier2.tasks.done} of {tier2.tasks.total} tasks
      </div>

      {/* Expandable task list */}
      {showTasks && tier2.subtasks && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2 pt-2 border-t space-y-1.5"
          style={{ borderColor: hexToRgba(parentColor, 0.2) }}
        >
          {tier2.subtasks.map((task) => (
            <div
              key={task.id}
              className="flex items-center gap-2 text-xs py-1 px-1.5 rounded hover:bg-white/50 transition-colors group/task"
            >
              <GripVertical size={10} className="text-foreground/20 opacity-0 group-hover/task:opacity-100 transition-opacity" />
              <div className={`w-2.5 h-2.5 rounded-full border ${task.done ? 'bg-module-green border-module-green' : 'border-foreground/20'}`}>
                {task.done && <Check size={8} className="text-white" />}
              </div>
              <span className={`${task.done ? 'text-foreground/50 line-through' : 'text-foreground/70'}`}>
                {task.title}
              </span>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

const AppShowcase = () => {
  return (
    <section className="py-24 md:py-40 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-accent/20 via-transparent to-accent/30" />
      
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: cubicEase }}
          className="text-center mb-16"
        >
          <span className="section-label">Flexible by Design</span>
          <h2 className="heading-section mt-4">
            Build anything,
            <br />
            <span className="gradient-text">your way</span>
          </h2>
          <p className="body-text text-lg max-w-2xl mx-auto mt-6">
            Custom categories, flexible hierarchies, and presets for any workflow.
            From construction to marketing, fitness to design — make it yours.
          </p>
        </motion.div>

        {/* Category Progress Grid - matching app's responsive layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.map((category, i) => (
            <CategoryCard key={category.name} category={category} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default AppShowcase;
