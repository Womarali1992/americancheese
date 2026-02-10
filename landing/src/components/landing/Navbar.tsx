import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles } from "lucide-react";

const navLinks = [
  { label: "Features", href: "#features" },
  { label: "Modules", href: "#modules" },
  { label: "Pricing", href: "#pricing" },
  { label: "Docs", href: "#docs" },
];

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/80 backdrop-blur-2xl py-3 shadow-elevated border-b border-border/50"
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto flex items-center justify-between px-6">
        {/* Logo */}
        <a href="#" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/30 rounded-xl blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-300" />
            <div className="relative w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-105 border border-primary/20">
              <img src="/logo-icon-colored.svg" alt="Site Setups" className="w-6 h-6" />
            </div>
          </div>
          <span className="font-heading font-semibold text-foreground tracking-[-0.02em] text-xl">
            Site Setups
          </span>
        </a>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="relative px-4 py-2 font-body text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200 group"
            >
              {link.label}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-primary to-slate-500 rounded-full group-hover:w-1/2 transition-all duration-300" />
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:flex items-center gap-3">
          <a
            href="https://app.sitesetups.com/login"
            className="px-4 py-2 font-body text-sm font-medium text-muted-foreground hover:text-foreground transition-colors duration-200"
          >
            Sign in
          </a>
          <a
            href="https://app.sitesetups.com/signup"
            className="group relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-primary to-slate-500 text-primary-foreground font-body text-sm font-semibold shadow-primary-glow hover:shadow-glow transition-all duration-300 hover:scale-105"
          >
            <Sparkles size={14} className="opacity-80" />
            Get Started
            <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </a>
        </div>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden relative w-10 h-10 flex items-center justify-center text-foreground"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          <AnimatePresence mode="wait">
            {mobileOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <X size={24} />
              </motion.div>
            ) : (
              <motion.div
                key="menu"
                initial={{ rotate: 90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Menu size={24} />
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden bg-white/95 backdrop-blur-2xl border-t border-border/50"
          >
            <div className="container mx-auto px-6 py-6 flex flex-col gap-2">
              {navLinks.map((link, i) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="px-4 py-3 font-body text-base font-medium text-foreground hover:bg-accent rounded-xl transition-colors"
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.a
                href="https://app.sitesetups.com/login"
                onClick={() => setMobileOpen(false)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-4 px-6 py-3 rounded-full border border-border text-foreground font-body text-sm font-medium text-center"
              >
                Sign in
              </motion.a>
              <motion.a
                href="https://app.sitesetups.com/signup"
                onClick={() => setMobileOpen(false)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-primary to-slate-500 text-primary-foreground font-body text-sm font-semibold"
              >
                <Sparkles size={14} />
                Get Started
              </motion.a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
