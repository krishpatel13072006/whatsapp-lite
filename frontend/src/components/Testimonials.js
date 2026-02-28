import React from 'react';

const TESTIMONIALS_COL1 = [
  { text: "This ERP revolutionized our operations, streamlining finance and inventory. The cloud-based platform keeps us productive, even remotely.", name: "Briana Patton", role: "Operations Manager", photo: "https://randomuser.me/api/portraits/women/44.jpg" },
  { text: "Implementing this solution was smooth and quick. The customizable, user-friendly interface made team training effortless.", name: "Bilal Ahmed", role: "IT Manager", photo: "https://randomuser.me/api/portraits/men/32.jpg" },
  { text: "The support team is exceptional, guiding us through setup and providing ongoing assistance, ensuring our satisfaction.", name: "Salman Malik", role: "Customer Support", photo: "https://randomuser.me/api/portraits/men/46.jpg" },
  { text: "Our online presence and conversions significantly improved, boosting overall business performance.", name: "Hassan Ali", role: "E-commerce Manager", photo: "https://randomuser.me/api/portraits/men/55.jpg" },
  { text: "They delivered a solution that exceeded expectations, understanding our needs and enhancing our operations.", name: "Sana Sheikh", role: "Sales Manager", photo: "https://randomuser.me/api/portraits/women/67.jpg" },
];

const TESTIMONIALS_COL2 = [
  { text: "The smooth implementation exceeded expectations. It streamlined processes, improving overall business performance.", name: "Aliza Khan", role: "Business Analyst", photo: "https://randomuser.me/api/portraits/women/29.jpg" },
  { text: "This solution's seamless integration enhanced our business operations and efficiency. Highly recommend for its intuitive interface.", name: "Omar Raza", role: "CEO", photo: "https://randomuser.me/api/portraits/men/75.jpg" },
  { text: "Its robust features and quick support have transformed our workflow, making us significantly more efficient.", name: "Zainab Hussain", role: "Project Manager", photo: "https://randomuser.me/api/portraits/women/56.jpg" },
  { text: "Our business functions improved with a user-friendly design and positive customer feedback across the board.", name: "Farhan Siddiqui", role: "Marketing Director", photo: "https://randomuser.me/api/portraits/men/41.jpg" },
  { text: "This platform transformed our operations with advanced features and excellent customer support throughout.", name: "Fatima Ahmed", role: "Finance Director", photo: "https://randomuser.me/api/portraits/women/12.jpg" },
];

const TESTIMONIALS_COL3 = [
  { text: "Our online presence and conversions significantly improved, boosting business performance dramatically.", name: "Ahmed Khan", role: "Tech Lead", photo: "https://randomuser.me/api/portraits/men/22.jpg" },
  { text: "The support team is exceptional, guiding us through setup and providing ongoing assistance every step of the way.", name: "Layla Hassan", role: "Operations Lead", photo: "https://randomuser.me/api/portraits/women/82.jpg" },
  { text: "Implementing this was smooth and quick. The customizable interface made team training completely effortless.", name: "Mohamed Ali", role: "System Admin", photo: "https://randomuser.me/api/portraits/men/64.jpg" },
  { text: "The smooth implementation exceeded expectations. It streamlined processes, improving overall business performance dramatically.", name: "Noor Malik", role: "Business Manager", photo: "https://randomuser.me/api/portraits/women/38.jpg" },
  { text: "This revolutionized our operations, streamlining finance and inventory with incredible efficiency gains.", name: "Karim Hassan", role: "Strategy Officer", photo: "https://randomuser.me/api/portraits/men/88.jpg" },
];

const TestimonialCard = ({ text, name, role, photo }) => (
  <div className="testimonial-marquee-card">
    <div className="shimmer-overlay" />
    <p className="testimonial-marquee-text">{text}</p>
    <div className="testimonial-user-info">
      <img
        src={photo}
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

const ScrollColumn = ({ testimonials, duration }) => (
  <div className="testimonial-scroll-col" style={{ '--col-duration': duration }}>
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

const Testimonials = () => {
  return (
    <section className="testimonials-marquee-section py-24 px-6 relative overflow-hidden">
      <div className="absolute inset-0 hero-glow opacity-20 pointer-events-none" />
      <div className="max-w-5xl mx-auto relative" style={{ zIndex: 10 }}>
        <div className="mb-14">
          <span className="section-label">Testimonials</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
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
