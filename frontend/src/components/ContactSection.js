import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, Github, Mail, MapPin } from 'lucide-react';
import emailjs from '@emailjs/browser';

// ─── EmailJS config ────────────────────────────────────────────────────────────
// 1. Sign up free at https://www.emailjs.com
// 2. Create a service (Gmail) → copy Service ID below
// 3. Create an email template with variables: {{from_name}}, {{from_email}}, {{message}}
//    Set "To Email" in the template to: krishpatelhacker.13579@gmail.com
// 4. Copy your Public Key from Account → API Keys
const EMAILJS_SERVICE_ID = 'YOUR_SERVICE_ID';   // e.g. 'service_abc123'
const EMAILJS_TEMPLATE_ID = 'YOUR_TEMPLATE_ID';  // e.g. 'template_xyz789'
const EMAILJS_PUBLIC_KEY = 'YOUR_PUBLIC_KEY';   // e.g. 'abcDEF123456'
// ───────────────────────────────────────────────────────────────────────────────

const ContactSection = () => {
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState(null); // null | 'sending' | 'sent' | 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('sending');

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: form.name,
          from_email: form.email,
          message: form.message,
          to_email: 'krishpatelhacker.13579@gmail.com',
        },
        EMAILJS_PUBLIC_KEY
      );
      setStatus('sent');
      setForm({ name: '', email: '', message: '' });
      setTimeout(() => setStatus(null), 4000);
    } catch (err) {
      console.error('EmailJS error:', err);
      setStatus('error');
      setTimeout(() => setStatus(null), 4000);
    }
  };

  return (
    <section className="py-16 md:py-24 px-4 md:px-6 relative">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <span className="section-label">About</span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-display font-bold mt-4 mb-4 md:mb-6 text-foreground">
              About The Developer
            </h2>
            <div className="w-16 h-1 bg-primary rounded-full mb-4 md:mb-6" />
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-3 md:mb-4">
              I built WhatsApp-Lite to demonstrate my capacity to handle complex, real-time data flow
              in a full-stack environment.
            </p>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-6 md:mb-8">
              My core focus is on creating seamless digital experiences using React, Node.js, WebSockets,
              and modern animation libraries like Framer Motion.
            </p>
            <div className="flex gap-3 md:gap-4">
              {[Github, Mail, MapPin].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            className="glass-card p-6 md:p-8 relative overflow-hidden"
          >
            <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/10 blur-[80px]" />
            <h3 className="text-lg md:text-xl font-display font-bold text-foreground mb-2 relative z-10">Let's Connect</h3>
            <p className="text-muted-foreground text-xs md:text-sm mb-5 md:mb-6 relative z-10">Drop a message to discuss architecture, code, or a role.</p>

            {status === 'sent' ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-10 md:py-12">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <CheckCircle size={24} className="text-primary" />
                </div>
                <h4 className="font-display font-bold text-foreground text-base md:text-lg">Message Sent!</h4>
                <p className="text-muted-foreground text-xs md:text-sm mt-2">I'll get back to you soon.</p>
              </motion.div>
            ) : status === 'error' ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center py-10 md:py-12">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-3 md:mb-4">
                  <span className="text-red-400 text-2xl">✕</span>
                </div>
                <h4 className="font-display font-bold text-foreground text-base md:text-lg">Failed to Send</h4>
                <p className="text-muted-foreground text-xs md:text-sm mt-2">Please try again or email directly.</p>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 relative z-10">
                {[
                  { label: 'Name', type: 'text', key: 'name', placeholder: 'John Doe' },
                  { label: 'Email', type: 'email', key: 'email', placeholder: 'john@example.com' },
                ].map((field) => (
                  <div key={field.key}>
                    <label className="text-xs font-medium text-muted-foreground mb-1 block">{field.label}</label>
                    <input
                      type={field.type}
                      value={form[field.key]}
                      onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                      required
                      className="w-full bg-muted border border-border focus:border-primary rounded-xl px-4 py-2.5 md:py-3 text-foreground text-sm outline-none transition-colors focus:ring-1 focus:ring-primary/50"
                      placeholder={field.placeholder}
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Message</label>
                  <textarea
                    rows={3}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    required
                    className="w-full bg-muted border border-border focus:border-primary rounded-xl px-4 py-2.5 md:py-3 text-foreground text-sm outline-none transition-colors resize-none focus:ring-1 focus:ring-primary/50"
                    placeholder="How can we collaborate?"
                  />
                </div>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={status === 'sending'}
                  className={`w-full py-3 md:py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors ${status === 'sending'
                      ? 'bg-muted text-muted-foreground cursor-not-allowed'
                      : 'bg-primary text-primary-foreground hover:brightness-110 shadow-lg shadow-primary/20'
                    }`}
                >
                  {status === 'sending' ? <><span className="animate-spin">⟳</span> Sending...</> : <>Send Message <Send size={16} /></>}
                </motion.button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
