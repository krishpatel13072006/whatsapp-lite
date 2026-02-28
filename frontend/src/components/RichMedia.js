import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import * as THREE from 'three';

// ============== GRADUAL SPACING ANIMATION ==============
function GradualSpacing({ text = '', className = '' }) {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true });

    return (
        <div ref={ref} className="flex justify-center flex-wrap gap-0">
            <AnimatePresence>
                {text.split('').map((char, i) => (
                    <motion.span
                        key={i}
                        initial={{ opacity: 0, x: -20, rotateZ: -10 }}
                        animate={isInView ? { opacity: 1, x: 0, rotateZ: 0 } : {}}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.6, delay: i * 0.05, ease: [0.23, 1, 0.32, 1] }}
                        className={className}
                    >
                        {char === ' ' ? <span>&nbsp;</span> : char}
                    </motion.span>
                ))}
            </AnimatePresence>
        </div>
    );
}

// ============== ICONS ==============
const PointerIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15.08 9.61a1.06 1.06 0 0 0-1.5-.17l-2.58 2.12V3.06a1.06 1.06 0 0 0-2.12 0v11.33l-2.58-2.12a1.06 1.06 0 0 0-1.5.17 1.06 1.06 0 0 0 .17 1.5l4.63 3.8a2.53 2.53 0 0 0 3.2 0l4.63-3.8a1.06 1.06 0 0 0 .17-1.5Z" />
        <path d="M4 22h16" />
    </svg>
);
const ShoppingBagIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
        <path d="M3 6h18" />
        <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
);
const DocumentIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
);
const MapPinIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
        <circle cx="12" cy="10" r="3" />
    </svg>
);
const ImageIcon = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
    </svg>
);
const SparklesIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </svg>
);

// ============== THREE.JS BACKGROUND (section-scoped) ==============
const ThreeJSBackground = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (!containerRef.current) return;
        const el = containerRef.current;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, el.clientWidth / el.clientHeight, 0.1, 1000);
        camera.position.z = 30;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setSize(el.clientWidth, el.clientHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        el.appendChild(renderer.domElement);

        const particlesGeometry = new THREE.BufferGeometry();
        const count = 250;
        const posArray = new Float32Array(count * 3);
        for (let i = 0; i < count * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 100;
        }
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.2,
            color: 0x22D3EE,
            transparent: true,
            opacity: 0.4,
            sizeAttenuation: true,
        });

        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particles);

        let animId;
        const animate = () => {
            animId = requestAnimationFrame(animate);
            particles.rotation.x += 0.0002;
            particles.rotation.y += 0.0004;
            renderer.render(scene, camera);
        };
        animate();

        const handleResize = () => {
            camera.aspect = el.clientWidth / el.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(el.clientWidth, el.clientHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animId);
            if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
            particlesGeometry.dispose();
            particlesMaterial.dispose();
            renderer.dispose();
        };
    }, []);

    return <div ref={containerRef} className="absolute inset-0 z-0" style={{ pointerEvents: 'none' }} />;
};

// ============== FEATURE CARD ==============
const Card = ({ item, index }) => {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.7, y: 60 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: index * 0.1, ease: [0.23, 1, 0.32, 1] }}
            onHoverStart={() => setIsHovered(true)}
            onHoverEnd={() => setIsHovered(false)}
            className={`w-52 h-52 rounded-2xl bg-gradient-to-br ${item.color} p-6 flex flex-col relative overflow-hidden cursor-pointer`}
        >
            <motion.div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" animate={{ opacity: isHovered ? 0 : 1 }} transition={{ duration: 0.4 }} />
            <motion.div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent opacity-0" animate={{ opacity: isHovered ? 1 : 0 }} transition={{ duration: 0.4 }} />
            <motion.div
                className="absolute inset-0 rounded-2xl pointer-events-none"
                animate={{ boxShadow: isHovered ? '0 0 40px rgba(34,211,238,0.9), inset 0 0 25px rgba(255,255,255,0.15)' : '0 0 15px rgba(34,211,238,0.4), inset 0 0 8px rgba(255,255,255,0.05)' }}
                transition={{ duration: 0.4 }}
            />

            <motion.div className="flex-1 flex items-center justify-center relative z-10" animate={{ scale: isHovered ? 1.35 : 1 }} transition={{ type: 'spring', stiffness: 200, duration: 0.5 }}>
                <motion.div
                    className="bg-white/20 p-4 rounded-2xl backdrop-blur-xl border border-white/30"
                    animate={{ boxShadow: isHovered ? '0 0 35px rgba(255,255,255,0.5)' : '0 0 10px rgba(255,255,255,0.15)' }}
                    transition={{ duration: 0.4 }}
                >
                    {item.icon}
                </motion.div>
            </motion.div>

            {isHovered && [...Array(6)].map((_, i) => (
                <motion.div
                    key={i}
                    className="absolute w-2 h-2 bg-white rounded-full"
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{ x: Math.cos((i / 6) * Math.PI * 2) * 70, y: Math.sin((i / 6) * Math.PI * 2) * 70, opacity: 0 }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    style={{ left: '50%', top: '50%', marginLeft: '-4px', marginTop: '-4px' }}
                />
            ))}

            <motion.div className="w-full text-left mt-auto relative z-10" animate={{ y: isHovered ? -8 : 0 }} transition={{ duration: 0.4 }}>
                <motion.h3 className="text-white font-bold text-lg mb-1" animate={{ letterSpacing: isHovered ? '0.08em' : '0.02em' }} transition={{ duration: 0.3 }}>
                    {item.title}
                </motion.h3>
                <p className="text-white/85 text-xs font-semibold">{item.desc}</p>
            </motion.div>
        </motion.div>
    );
};

// ============== SCROLLING ROW (left to right) ==============
const ScrollingRow = ({ items, reverse = false, speed = 30 }) => {
    const duplicated = [...items, ...items, ...items];
    return (
        <div className="relative w-full flex-shrink-0 overflow-hidden" style={{ height: '232px' }}>
            <motion.div
                className="flex flex-row gap-6 absolute left-0 top-0"
                style={{ width: 'max-content' }}
                animate={{ x: reverse ? ['-33.33%', '0%'] : ['0%', '-33.33%'] }}
                transition={{ duration: speed, repeat: Infinity, ease: 'linear' }}
            >
                {duplicated.map((item, i) => (
                    <Card key={`${item.id}-${i}`} item={item} index={i % items.length} />
                ))}
            </motion.div>
        </div>
    );
};

// ============== MAIN EXPORT ==============
const RichMedia = () => {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const containerRef = useRef(null);

    const features = [
        { id: 1, title: 'Quick Replies', desc: 'Interactive buttons', color: 'from-purple-600 to-pink-600', icon: <PointerIcon /> },
        { id: 2, title: 'Product Catalogs', desc: 'In-chat shopping', color: 'from-emerald-600 to-teal-700', icon: <ShoppingBagIcon /> },
        { id: 3, title: 'PDF Invoices', desc: 'Automated billing', color: 'from-orange-600 to-red-600', icon: <DocumentIcon /> },
        { id: 4, title: 'Live Locations', desc: 'Delivery tracking', color: 'from-indigo-600 to-purple-700', icon: <MapPinIcon /> },
        { id: 5, title: 'Rich Media', desc: 'Images & Videos', color: 'from-rose-600 to-pink-700', icon: <ImageIcon /> },
    ];

    const handleMouseMove = (e) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setMousePosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    return (
        <section
            id="rich-media"
            ref={containerRef}
            onMouseMove={handleMouseMove}
            className="relative w-full overflow-hidden flex items-center justify-center"
            style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #020617 0%, #0c1a3a 50%, #0f172a 100%)' }}
        >
            {/* Three.js particles */}
            <ThreeJSBackground />

            {/* Mouse-follow glow */}
            <motion.div
                className="absolute w-96 h-96 rounded-full blur-3xl pointer-events-none z-0"
                style={{
                    background: 'radial-gradient(circle, rgba(34,211,238,0.22) 0%, transparent 70%)',
                    x: mousePosition.x - 192,
                    y: mousePosition.y - 192,
                }}
                transition={{ type: 'spring', damping: 40, stiffness: 200 }}
            />

            {/* Diagonal scrolling rows — left to right */}
            <div
                className="absolute flex flex-col gap-6 pointer-events-auto"
                style={{ width: '250vw', height: '220vh', transform: 'rotate(-30deg)', left: '-25%', top: '-40%' }}
            >
                <ScrollingRow items={features} speed={28} />
                <ScrollingRow items={features} speed={34} reverse />
                <ScrollingRow items={features} speed={25} />
                <ScrollingRow items={features} speed={32} reverse />
                <ScrollingRow items={features} speed={30} />
            </div>

            {/* Overlay content */}
            <motion.div
                className="absolute top-1/2 -translate-y-1/2 left-8 md:left-12 z-20 pointer-events-none max-w-xl backdrop-blur-xl rounded-2xl p-6 md:p-8 border border-blue-400/20 shadow-2xl"
                style={{ background: 'linear-gradient(135deg, rgba(2,6,23,0.95) 0%, rgba(12,26,58,0.9) 50%, rgba(2,6,23,0.95) 100%)' }}
                initial={{ opacity: 0, x: -80 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            >
                {/* Badge */}
                <motion.div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-400/50 text-cyan-200 text-xs font-bold mb-5 pointer-events-auto"
                    style={{ background: 'linear-gradient(to right, rgba(59,130,246,0.2), rgba(34,211,238,0.2))' }}
                    whileHover={{ scale: 1.08 }}
                >
                    <motion.span className="relative flex h-2 w-2" animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 2.5, repeat: Infinity }}>
                        <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-80" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-400" />
                    </motion.span>
                    ✨ Rich Messaging Features
                </motion.div>

                {/* Animated title */}
                <div className="mb-4">
                    <GradualSpacing
                        text="Transform Your Customer Conversations"
                        className="text-2xl md:text-3xl font-black bg-gradient-to-r from-blue-200 via-cyan-300 to-blue-100 bg-clip-text text-transparent"
                    />
                </div>

                {/* Subtitle */}
                <motion.p
                    className="text-sm md:text-base text-cyan-100/80 mb-6 leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.5 }}
                >
                    Send interactive buttons, product catalogs, automated PDFs, and rich media directly through WhatsApp.
                </motion.p>

                {/* CTA */}
                <motion.button
                    className="relative text-white px-6 py-3 rounded-full font-bold text-sm pointer-events-auto overflow-hidden shadow-2xl"
                    style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6)' }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                    whileHover={{ scale: 1.08, boxShadow: '0 20px 50px rgba(34,211,238,0.5)' }}
                >
                    <span className="relative flex items-center gap-2">
                        Explore Templates
                        <motion.svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                            animate={{ x: [0, 6, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
                            <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
                        </motion.svg>
                    </span>
                </motion.button>
            </motion.div>

            {/* Floating sparkles */}
            <motion.div className="absolute top-1/4 right-1/3 text-cyan-400 opacity-60 z-10" animate={{ y: [0, -25, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                <SparklesIcon />
            </motion.div>
            <motion.div className="absolute bottom-1/3 right-1/4 text-cyan-300 opacity-40 z-10" animate={{ y: [0, -20, 0] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}>
                <SparklesIcon />
            </motion.div>

            {/* Vignette */}
            <div className="absolute inset-0 pointer-events-none z-10" style={{ background: 'radial-gradient(circle at center, transparent 20%, rgba(2,6,23,0.65) 90%)' }} />
        </section>
    );
};

export default RichMedia;
