import { motion } from "framer-motion";
import { ListTodo, AlertTriangle, Brain, Paperclip, Check, Clock, MessageSquare, FileText } from "lucide-react";

const cubicEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

const features = [
  {
    icon: ListTodo,
    title: "Subtasks",
    color: "#2563eb",
    description: "Break down complex tasks into smaller, manageable pieces. Track progress on each step.",
    preview: [
      { text: "Set up database schema", done: true },
      { text: "Create API endpoints", done: true },
      { text: "Build frontend components", done: false },
      { text: "Write integration tests", done: false },
    ],
  },
  {
    icon: AlertTriangle,
    title: "Blocker Board",
    color: "#ea580c",
    description: "Identify what's holding you back. Clear blockers before they derail your timeline.",
    preview: [
      { text: "Waiting on API credentials", status: "blocked" },
      { text: "Design review needed", status: "pending" },
      { text: "Budget approval", status: "resolved" },
    ],
  },
  {
    icon: Brain,
    title: "Project Context",
    color: "#16a34a",
    description: "Give AI the full picture. Your project structure, goals, and constraints — all in one place.",
    preview: [
      { label: "Mission", value: "Launch MVP by Q2" },
      { label: "Tech Stack", value: "React, Node, PostgreSQL" },
      { label: "Constraints", value: "Must support mobile" },
    ],
  },
  {
    icon: Paperclip,
    title: "Attachments",
    color: "#8b5cf6",
    description: "Keep everything together. Documents, images, and files right where you need them.",
    preview: [
      { name: "wireframes.pdf", size: "2.4 MB" },
      { name: "api-spec.json", size: "156 KB" },
      { name: "logo-final.svg", size: "12 KB" },
    ],
  },
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
  const Icon = feature.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.98 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.1, ease: cubicEase }}
      className="group rounded-xl overflow-hidden border shadow-card hover:shadow-elevated transition-all duration-300 bg-white"
      style={{ borderColor: `${feature.color}30` }}
    >
      {/* Header */}
      <div
        className="px-4 py-4 border-b flex items-center gap-3"
        style={{
          backgroundColor: `${feature.color}08`,
          borderColor: `${feature.color}20`
        }}
      >
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${feature.color}15` }}
        >
          <Icon size={20} style={{ color: feature.color }} />
        </div>
        <div>
          <h3 className="font-heading font-semibold text-foreground">
            {feature.title}
          </h3>
        </div>
      </div>

      {/* Description */}
      <div className="px-4 py-3 border-b" style={{ borderColor: `${feature.color}15` }}>
        <p className="text-sm text-foreground/60 leading-relaxed">
          {feature.description}
        </p>
      </div>

      {/* Preview */}
      <div className="px-4 py-3 space-y-2" style={{ backgroundColor: `${feature.color}05` }}>
        {feature.title === "Subtasks" && (
          <div className="space-y-1.5">
            {(feature.preview as { text: string; done: boolean }[]).map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div
                  className={`w-4 h-4 rounded flex items-center justify-center ${
                    item.done ? 'bg-green-500' : 'border border-gray-300'
                  }`}
                >
                  {item.done && <Check size={12} className="text-white" />}
                </div>
                <span className={item.done ? 'text-foreground/50 line-through' : 'text-foreground/70'}>
                  {item.text}
                </span>
              </div>
            ))}
          </div>
        )}

        {feature.title === "Blocker Board" && (
          <div className="space-y-1.5">
            {(feature.preview as { text: string; status: string }[]).map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <div
                  className={`w-2 h-2 rounded-full ${
                    item.status === 'blocked' ? 'bg-red-500' :
                    item.status === 'pending' ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                />
                <span className="text-foreground/70 flex-1">{item.text}</span>
                <span className={`text-[10px] uppercase font-medium px-1.5 py-0.5 rounded ${
                  item.status === 'blocked' ? 'bg-red-100 text-red-600' :
                  item.status === 'pending' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-600'
                }`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        )}

        {feature.title === "Project Context" && (
          <div className="space-y-1.5">
            {(feature.preview as { label: string; value: string }[]).map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-foreground/50 font-medium min-w-[80px]">{item.label}:</span>
                <span className="text-foreground/70">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        {feature.title === "Attachments" && (
          <div className="space-y-1.5">
            {(feature.preview as { name: string; size: string }[]).map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-md bg-white/50">
                <FileText size={14} className="text-foreground/40" />
                <span className="text-foreground/70 flex-1">{item.name}</span>
                <span className="text-[10px] text-foreground/40">{item.size}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const MaterialShowcase = () => {
  return (
    <section className="py-24 md:py-40 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 mesh-gradient opacity-40" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, ease: cubicEase }}
          className="text-center mb-16"
        >
          <span className="section-label">Task Details</span>
          <h2 className="heading-section mt-4">
            Nothing slips
            <br />
            <span className="gradient-text">through the cracks</span>
          </h2>
          <p className="body-text text-lg max-w-2xl mx-auto mt-6">
            Every task has everything you need — subtasks, blockers, context, and files.
            Stay organized without switching between a dozen apps.
          </p>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
          {features.map((feature, i) => (
            <FeatureCard key={feature.title} feature={feature} index={i} />
          ))}
        </div>

        {/* Feature callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4, ease: cubicEase }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-4 px-6 py-3 rounded-full bg-white/60 backdrop-blur-xl border border-border shadow-card">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground">
                All updates sync in real-time
              </span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-primary" />
              <span className="text-sm font-medium text-foreground">
                Comments on everything
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MaterialShowcase;
