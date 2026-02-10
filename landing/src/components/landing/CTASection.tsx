import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Check } from "lucide-react";

const benefits = ["No credit card required", "14-day free trial", "Cancel anytime"];

const CTASection = () => {
  return (
    <section id="cta" className="py-24 md:py-40">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[2.5rem] overflow-hidden"
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-ink via-[#1a2030] to-ink" />
          
          {/* Animated gradient orbs */}
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] animate-pulse-glow" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-slate-500/15 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: "1.5s" }} />
          
          {/* Grid pattern */}
          <div 
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
              backgroundSize: '32px 32px',
            }}
          />

          <div className="relative z-10 px-8 py-24 md:px-16 md:py-32 text-center">
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 mb-10"
            >
              <Sparkles size={14} className="text-primary" />
              <span className="font-body text-sm font-medium text-white/80">
                Start your free trial today
              </span>
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="font-heading font-bold tracking-[-0.03em] text-white text-balance mb-8"
              style={{ fontSize: "clamp(2.5rem, 5vw + 1rem, 4.5rem)", lineHeight: 1.05 }}
            >
              Ready to take control
              <br />
              <span className="bg-gradient-to-r from-primary via-blue-400 to-slate-400 bg-clip-text text-transparent">
                of your projects?
              </span>
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="font-body text-lg md:text-xl text-white/60 max-w-lg mx-auto mb-10"
            >
              Join teams who deliver projects on time and on budget with
              Site Setups.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10"
            >
              <a
                href="https://app.sitesetups.com/signup"
                className="group relative inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-white text-ink font-body text-base font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                Get Started Free
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
              </a>
              <a
                href="https://app.sitesetups.com/login"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-white/10 backdrop-blur-xl border border-white/10 text-white font-body text-base font-medium hover:bg-white/20 transition-all duration-300"
              >
                Sign In
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap items-center justify-center gap-6"
            >
              {benefits.map((benefit) => (
                <span key={benefit} className="inline-flex items-center gap-2 text-white/50 font-body text-sm">
                  <Check size={14} className="text-module-green" />
                  {benefit}
                </span>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
