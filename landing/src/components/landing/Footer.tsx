import { Github, Twitter, Linkedin, ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";

const footerLinks = {
  Product: ["Features", "Modules", "Pricing", "Changelog", "Roadmap"],
  Resources: ["Documentation", "API Reference", "Guides", "Blog", "Community"],
  Company: ["About", "Careers", "Press", "Contact", "Partners"],
  Legal: ["Privacy", "Terms", "Security", "Cookies"],
};

const Footer = () => {
  return (
    <footer className="relative bg-ink text-primary-foreground overflow-hidden">
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
      
      <div className="container mx-auto px-6 py-20 md:py-24 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-10 lg:gap-8">
          {/* Brand column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-primary-glow">
                  <img src="/logo-icon-colored.svg" alt="Site Setups" className="w-6 h-6" />
                </div>
                <span className="font-heading font-semibold text-primary-foreground tracking-[-0.02em] text-xl">
                  Site Setups
                </span>
              </div>
              <p className="font-body text-sm text-primary-foreground/40 max-w-xs leading-relaxed mb-8">
                AI context engineering and project management for teams that build amazing things.
              </p>
              <div className="flex gap-3">
                {[
                  { icon: Github, label: "GitHub" },
                  { icon: Twitter, label: "Twitter" },
                  { icon: Linkedin, label: "LinkedIn" },
                ].map(({ icon: Icon, label }) => (
                  <a
                    key={label}
                    href="#"
                    aria-label={label}
                    className="group w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 flex items-center justify-center text-primary-foreground/40 hover:text-primary-foreground transition-all duration-300"
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links], idx) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: (idx + 1) * 0.1 }}
            >
              <h4 className="font-heading font-semibold text-primary-foreground text-sm mb-5">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="group inline-flex items-center gap-1 font-body text-sm text-primary-foreground/40 hover:text-primary-foreground transition-colors duration-200"
                    >
                      {link}
                      <ArrowUpRight size={12} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200" />
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        {/* Newsletter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-16 pt-10 border-t border-white/5"
        >
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div>
              <h4 className="font-heading font-semibold text-primary-foreground text-lg mb-2">
                Stay in the loop
              </h4>
              <p className="font-body text-sm text-primary-foreground/40">
                Get product updates and engineering insights delivered to your inbox.
              </p>
            </div>
            <div className="flex w-full lg:w-auto gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 lg:w-64 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-primary-foreground placeholder:text-primary-foreground/30 font-body text-sm focus:outline-none focus:border-primary/50 transition-colors"
              />
              <button className="px-6 py-3 rounded-xl bg-gradient-to-r from-primary to-slate-500 text-primary-foreground font-body text-sm font-semibold hover:opacity-90 transition-opacity">
                Subscribe
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5 relative z-10">
        <div className="container mx-auto px-6 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-body text-xs text-primary-foreground/30">
            © 2026 Site Setups. All rights reserved.
          </span>
          <div className="flex items-center gap-6">
            {["Privacy Policy", "Terms of Service", "Cookie Settings"].map((link) => (
              <a
                key={link}
                href="#"
                className="font-body text-xs text-primary-foreground/30 hover:text-primary-foreground/60 transition-colors duration-200"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
