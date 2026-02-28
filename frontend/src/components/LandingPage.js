import React from 'react';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import TextReveal from './TextReveal';
import ScrollTicker from './ScrollTicker';
import FeaturesGrid from './FeaturesGrid';
import HowItWorks from './HowItWorks';
import Testimonials from './Testimonials';
import CompaniesSection from './CompaniesSection';
import RichMedia from './RichMedia';
import PricingSection from './PricingSection';
import FAQSection from './FAQSection';
import ContactSection from './ContactSection';
import Footer from './Footer';
import InfiniteMarquee from './InfiniteMarquee';

const Index = ({ onGetStarted, onLoginClick, isLoggedIn }) => {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Navbar onGetStarted={onGetStarted} onLoginClick={onLoginClick} isLoggedIn={isLoggedIn} />
      <HeroSection onGetStarted={onGetStarted} />

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

      <div id="rich-media">
        <RichMedia />
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
      <InfiniteMarquee />
    </div>
  );
};

export default Index;
