import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-8 border-t border-border text-center">
      <p className="text-sm text-muted-foreground">
        © {new Date().getFullYear()} WhatsApp-Lite. Designed & Engineered with React, Node & Framer Motion.
      </p>
    </footer>
  );
};

export default Footer;
