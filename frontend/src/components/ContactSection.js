import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle, Github, Mail, MapPin } from 'lucide-react';

const ContactSection = () => {
  const [formState, setFormState] = useState('idle'); // idle, loading, success

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormState('loading');
    setTimeout(() => setFormState('success'), 1500);
  };

  return (
    <section id="contact" className="py-24 px-6 relative bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">
              Let's build the future of <span className="text-gradient">messaging</span> together.
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              Have questions about our architecture, security protocols, or enterprise solutions? Our engineering team is here to help.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Mail size={24} />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Email us</h4>
                  <p className="text-muted-foreground text-sm">engineering@whatsapplite.io</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <MapPin size={24} />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Visit us</h4>
                  <p className="text-muted-foreground text-sm">Palo Alto, California</p>
                </div>
              </div>
            </div>

            <div className="mt-12 flex items-center gap-6">
              <div className="flex -space-x-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full border-2 border-background bg-muted overflow-hidden">
                    <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="Team member" />
                  </div>
                ))}
              </div>
              <p className="text-sm font-medium">
                Join <span className="text-primary">500+ developers</span> building on our API.
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-background rounded-3xl p-8 md:p-10 border border-border shadow-2xl shadow-primary/5 relative overflow-hidden"
          >
            {formState === 'success' ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto mb-6">
                  <CheckCircle size={40} />
                </div>
                <h3 className="text-2xl font-bold mb-2">Message received!</h3>
                <p className="text-muted-foreground mb-8">
                  Our team will get back to you within 24 hours.
                </p>
                <button
                  onClick={() => setFormState('idle')}
                  className="text-primary font-semibold hover:underline"
                >
                  Send another message
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Name</label>
                    <input
                      required
                      type="text"
                      className="w-full h-12 px-4 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <input
                      required
                      type="email"
                      className="w-full h-12 px-4 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject</label>
                  <select className="w-full h-12 px-4 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all">
                    <option>General Inquiry</option>
                    <option>Technical Support</option>
                    <option>Partnership</option>
                    <option>Enterprise</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Message</label>
                  <textarea
                    required
                    rows={4}
                    className="w-full p-4 rounded-xl bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none"
                    placeholder="How can we help?"
                  />
                </div>
                <button
                  disabled={formState === 'loading'}
                  type="submit"
                  className="w-full h-14 bg-primary text-primary-foreground font-bold rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                >
                  {formState === 'loading' ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  ) : (
                    <>
                      Send Message
                      <Send size={18} />
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
