import React from 'react';
import { motion } from 'framer-motion';
import { UserPlus, QrCode, MessageCircle, Cloud } from 'lucide-react';

const STEPS = [
  { step: "01", title: "Create Account", desc: "Sign up with your phone number or email in seconds.", icon: UserPlus },
  { step: "02", title: "Find Contacts", desc: "Search for friends or scan QR codes to connect.", icon: QrCode },
  { step: "03", title: "Start Chatting", desc: "Send messages, media, and make calls instantly.", icon: MessageCircle },
  { step: "04", title: "Stay Connected", desc: "Access your chats from any device, anytime.", icon: Cloud },
];

const HowItWorks: React.FC = () => {
  return (
    <section className="py-16 md:py-24 px-4 md:px-6 relative">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-10 md:mb-16"
        >
          <span className="section-label">Process</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mt-4 mb-4 text-foreground">How It Works</h2>
          <p className="text-muted-foreground text-base md:text-lg">Get started in minutes with our simple process</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {STEPS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card p-5 md:p-6 text-center relative group"
              >
                <div className="feature-icon-wrap mx-auto mb-4">
                  <Icon size={22} className="text-primary" />
                </div>
                <span className="text-4xl md:text-5xl font-display font-bold text-primary/10 absolute top-3 right-3 md:top-4 md:right-4">{item.step}</span>
                <h3 className="font-display font-semibold text-foreground text-base md:text-lg mb-2">{item.title}</h3>
                <p className="text-muted-foreground text-xs md:text-sm">{item.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
