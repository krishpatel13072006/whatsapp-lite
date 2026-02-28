import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const PRICING = [
  { name: "Free", price: "$0", period: "forever", features: ["Unlimited messages", "Voice & Video calls", "File sharing up to 100MB", "Group chats (up to 256)", "Status updates", "End-to-end encryption"] },
  { name: "Pro", price: "$4.99", period: "month", features: ["Everything in Free", "Priority support", "Larger file uploads", "Custom themes", "Advanced analytics", "API access"], popular: true },
  { name: "Business", price: "$9.99", period: "month", features: ["Everything in Pro", "Team management", "Admin controls", "Analytics dashboard", "Priority API access", "Dedicated support"] },
];

const PricingSection = () => {
  return (
    <section className="py-16 md:py-24 px-4 md:px-6 relative">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-10 md:mb-16"
        >
          <span className="section-label">Pricing</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-display font-bold mt-4 mb-4 text-foreground">Simple Pricing</h2>
          <p className="text-muted-foreground text-base md:text-lg">Choose the plan that works for you</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {PRICING.map((plan, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.1 }}
              className={`glass-card p-5 md:p-6 relative ${plan.popular ? 'glow-border ring-1 ring-primary/30' : ''}`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-xs font-bold rounded-full">
                  POPULAR
                </span>
              )}
              <h3 className="font-display font-bold text-lg md:text-xl text-foreground mb-2">{plan.name}</h3>
              <div className="mb-5 md:mb-6">
                <span className="text-3xl md:text-4xl font-display font-bold text-foreground">{plan.price}</span>
                <span className="text-muted-foreground text-sm">/{plan.period}</span>
              </div>
              <ul className="space-y-2.5 md:space-y-3 mb-6 md:mb-8">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
                    <CheckCircle size={14} className="text-primary flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                plan.popular
                  ? 'bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20'
                  : 'border border-border text-foreground hover:bg-muted'
              }`}>
                Get Started
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
