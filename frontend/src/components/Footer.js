import React from 'react';

const Footer = () => {
  return (
    <footer className="py-8 border-t border-border text-center">
      <p className="text-sm text-muted-foreground">
        © {new Date().getFullYear()} SparkChat. Designed & Engineered with React, Node & Framer Motion.
      </p>
    </footer>
  );
};

export default Footer;
