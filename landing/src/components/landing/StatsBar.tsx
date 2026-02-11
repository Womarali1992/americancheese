import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

const stats = [
  { value: 12000, suffix: "+", label: "Projects Managed" },
  { value: 98, suffix: "%", label: "Context Accuracy" },
  { value: 3.2, suffix: "x", label: "Faster Delivery" },
  { value: 500, suffix: "+", label: "Teams Active" },
];

const AnimatedNumber = ({ value, suffix }: { value: number; suffix: string }) => {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => {
    if (suffix === "x") return latest.toFixed(1);
    return Math.round(latest).toLocaleString();
  });
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animate(count, value, { duration: 2, ease: [0.16, 1, 0.3, 1] });
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [count, value]);

  return (
    <span ref={ref} className="tabular-nums">
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
};

const StatsBar = () => {
  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Decorative lines */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="relative text-center group"
            >
              {/* Divider for desktop */}
              {i < stats.length - 1 && (
                <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-16 bg-gradient-to-b from-transparent via-border to-transparent" />
              )}
              
              <div className="font-heading font-bold text-5xl md:text-6xl lg:text-7xl bg-gradient-to-br from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent tracking-tight mb-3">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </div>
              
              <div className="font-body text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsBar;
