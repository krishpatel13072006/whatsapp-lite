import React from 'react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import TextReveal from '@/components/TextReveal';
import ScrollTicker from '@/components/ScrollTicker';
import FeaturesGrid from '@/components/FeaturesGrid';
import HowItWorks from '@/components/HowItWorks';
import Testimonials from '@/components/Testimonials';
import CompaniesSection from '@/components/CompaniesSection';
import PricingSection from '@/components/PricingSection';
import FAQSection from '@/components/FAQSection';
import ContactSection from '@/components/ContactSection';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar />
      <HeroSection />

      <section className="py-24">
        <TextReveal text="Built for speed, privacy, and seamless real-time communication across every device and platform." />
      </section>

      <ScrollTicker />

      <div id="features">
        <FeaturesGrid />
      </div>

      <div id="how-it-works">
        <HowItWorks />
      </div>

      <div id="companies">
        <CompaniesSection />
      </div>

      <div id="testimonials">
        <Testimonials />
      </div>

      <div id="pricing">
        <PricingSection />
      </div>

      <div id="faq">
        <FAQSection />
      </div>

      <div id="contact">
        <ContactSection />
      </div>

      <Footer />
    </div>
  );
};

export default Index;
