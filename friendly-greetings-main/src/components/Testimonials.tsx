import React from 'react';

const TESTIMONIALS_COL1 = [
  {
    text: "This ERP revolutionized our operations, streamlining finance and inventory. The cloud-based platform keeps us productive, even remotely.",
    name: "Briana Patton",
    role: "Operations Manager",
    seed: "Briana",
  },
  {
    text: "Implementing this solution was smooth and quick. The customizable, user-friendly interface made team training effortless.",
    name: "Bilal Ahmed",
    role: "IT Manager",
    seed: "Bilal",
  },
  {
    text: "The support team is exceptional, guiding us through setup and providing ongoing assistance, ensuring our satisfaction.",
    name: "Salman Malik",
    role: "Customer Support",
    seed: "Salman",
  },
  {
    text: "Our online presence and conversions significantly improved, boosting overall business performance.",
    name: "Hassan Ali",
    role: "E-commerce Manager",
    seed: "Hassan",
  },
  {
    text: "They delivered a solution that exceeded expectations, understanding our needs and enhancing our operations.",
    name: "Sana Sheikh",
    role: "Sales Manager",
    seed: "Sana",
  },
];

const TESTIMONIALS_COL2 = [
  {
    text: "The smooth implementation exceeded expectations. It streamlined processes, improving overall business performance.",
    name: "Aliza Khan",
    role: "Business Analyst",
    seed: "Aliza",
  },
  {
    text: "This solution's seamless integration enhanced our business operations and efficiency. Highly recommend for its intuitive interface.",
    name: "Omar Raza",
    role: "CEO",
    seed: "Omar",
  },
  {
    text: "Its robust features and quick support have transformed our workflow, making us significantly more efficient.",
    name: "Zainab Hussain",
    role: "Project Manager",
    seed: "Zainab",
  },
  {
    text: "Our business functions improved with a user-friendly design and positive customer feedback across the board.",
    name: "Farhan Siddiqui",
    role: "Marketing Director",
    seed: "Farhan",
  },
  {
    text: "This platform transformed our operations with advanced features and excellent customer support throughout.",
    name: "Fatima Ahmed",
    role: "Finance Director",
    seed: "Fatima",
  },
];

const TESTIMONIALS_COL3 = [
  {
    text: "Our online presence and conversions significantly improved, boosting business performance dramatically.",
    name: "Ahmed Khan",
    role: "Tech Lead",
    seed: "Ahmed",
  },
  {
    text: "The support team is exceptional, guiding us through setup and providing ongoing assistance every step of the way.",
    name: "Layla Hassan",
    role: "Operations Lead",
    seed: "Layla",
  },
  {
    text: "Implementing this was smooth and quick. The customizable interface made team training completely effortless.",
    name: "Mohamed Ali",
    role: "System Admin",
    seed: "Mohamed",
  },
  {
    text: "The smooth implementation exceeded expectations. It streamlined processes, improving overall business performance dramatically.",
    name: "Noor Malik",
    role: "Business Manager",
    seed: "Noor",
  },
  {
    text: "This revolutionized our operations, streamlining finance and inventory with incredible efficiency gains.",
    name: "Karim Hassan",
    role: "Strategy Officer",
    seed: "Karim",
  },
];

interface TestimonialCardProps {
  text: string;
  name: string;
  role: string;
  seed: string;
}

const TestimonialCard: React.FC<TestimonialCardProps> = ({ text, name, role, seed }) => (
  <div className="testimonial-marquee-card">
    <div className="shimmer-overlay" />
    <p className="testimonial-marquee-text">{text}</p>
    <div className="testimonial-user-info">
      <img
        src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`}
        alt={name}
        className="testimonial-avatar"
      />
      <div>
        <h4 className="testimonial-username">{name}</h4>
        <p className="testimonial-userrole">{role}</p>
      </div>
    </div>
  </div>
);

interface ScrollColumnProps {
  testimonials: TestimonialCardProps[];
  duration: string;
}

const ScrollColumn: React.FC<ScrollColumnProps> = ({ testimonials, duration }) => (
  <div className="testimonial-scroll-col" style={{ '--col-duration': duration } as React.CSSProperties}>
    <div className="testimonial-scroll-content">
      {testimonials.map((t, i) => (
        <TestimonialCard key={i} {...t} />
      ))}
      {/* Duplicate for seamless loop */}
      {testimonials.map((t, i) => (
        <TestimonialCard key={`dup-${i}`} {...t} />
      ))}
    </div>
  </div>
);

const Testimonials: React.FC = () => {
  return (
    <section className="testimonials-marquee-section py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 hero-glow opacity-20 pointer-events-none" />
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="mb-14">
          <span className="section-label">Testimonials</span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mt-4 text-foreground">
            What our clients say<br />about us
          </h2>
        </div>

        <div className="testimonials-marquee-container">
          <div className="testimonials-marquee-grid">
            <ScrollColumn testimonials={TESTIMONIALS_COL1} duration="28s" />
            <ScrollColumn testimonials={TESTIMONIALS_COL2} duration="32s" />
            <ScrollColumn testimonials={TESTIMONIALS_COL3} duration="26s" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
