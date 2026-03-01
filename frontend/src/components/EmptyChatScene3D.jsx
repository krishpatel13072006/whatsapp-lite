import { useRef, useState, useEffect, useMemo, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { MessageSquare, Lock } from 'lucide-react';

/* ─── Three.js Scene Elements ─────────────────────────────────────── */

function RotatingTorus() {
    const ref = useRef();
    useFrame((state) => {
        ref.current.rotation.x = state.clock.elapsedTime * 0.3;
        ref.current.rotation.y = state.clock.elapsedTime * 0.5;
        if (ref.current.material) {
            ref.current.material.emissiveIntensity =
                0.15 + Math.sin(state.clock.elapsedTime * 2) * 0.1;
        }
    });
    return (
        <mesh ref={ref} position={[0, 0, 0]}>
            <torusGeometry args={[1.2, 0.35, 32, 100]} />
            <meshStandardMaterial
                color="#00a884"
                emissive="#00ffd0"
                emissiveIntensity={0.2}
                roughness={0.25}
                metalness={0.85}
                transparent
                opacity={0.85}
            />
        </mesh>
    );
}

function InnerOrb() {
    const ref = useRef();
    useFrame((state) => {
        const s = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.1;
        ref.current.scale.setScalar(s);
        ref.current.rotation.y = state.clock.elapsedTime * 0.8;
        ref.current.rotation.z = state.clock.elapsedTime * 0.4;
        if (ref.current.material) {
            ref.current.material.emissiveIntensity =
                0.2 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
        }
    });
    return (
        <mesh ref={ref} position={[0, 0, 0]}>
            <sphereGeometry args={[0.55, 64, 64]} />
            <meshStandardMaterial
                color="#00d4aa"
                emissive="#00ffd0"
                emissiveIntensity={0.3}
                roughness={0.15}
                metalness={1}
            />
        </mesh>
    );
}

function OrbitingDot({ radius, speed, phase, color }) {
    const ref = useRef();
    useFrame((state) => {
        const t = state.clock.elapsedTime * speed + phase;
        ref.current.position.x = Math.cos(t) * radius;
        ref.current.position.z = Math.sin(t) * radius;
        ref.current.position.y = Math.sin(t * 0.7) * 0.5;
    });
    return (
        <Float speed={2} floatIntensity={0.5}>
            <mesh ref={ref}>
                <sphereGeometry args={[0.08, 16, 16]} />
                <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.5} />
            </mesh>
        </Float>
    );
}

function ParticleField() {
    const ref = useRef();

    const geo = useMemo(() => {
        const count = 300;
        const positions = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 12;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 12;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 12;
        }
        const g = new THREE.BufferGeometry();
        g.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        return g;
    }, []);

    useFrame((state) => {
        ref.current.rotation.y = state.clock.elapsedTime * 0.04;
        ref.current.rotation.x = state.clock.elapsedTime * 0.015;
    });

    return (
        <points ref={ref} geometry={geo}>
            <pointsMaterial color="#00a884" size={0.04} transparent opacity={0.5} sizeAttenuation />
        </points>
    );
}

function Scene3D() {
    return (
        <>
            <ambientLight intensity={0.4} />
            <pointLight position={[4, 4, 4]} intensity={2} color="#00ffd0" />
            <pointLight position={[-4, -4, -4]} intensity={1} color="#7c3aed" />
            <pointLight position={[0, 4, -4]} intensity={1.5} color="#3b82f6" />
            <ParticleField />
            <RotatingTorus />
            <InnerOrb />
            <OrbitingDot radius={2.2} speed={0.7} phase={0} color="#22d3ee" />
            <OrbitingDot radius={2.2} speed={0.7} phase={Math.PI * 0.66} color="#a78bfa" />
            <OrbitingDot radius={2.2} speed={0.7} phase={Math.PI * 1.33} color="#34d399" />
            <Sparkles count={60} scale={6} size={2} speed={0.4} color="#00a884" />
        </>
    );
}

/* ─── Feature Chips Data ───────────────────────────────────────────── */
const BUBBLES = [
    { text: 'Hey there! 👋', delay: 0, x: -40 },
    { text: 'How are you? 😊', delay: 1.2, x: 60 },
    { text: "Let's chat! 💬", delay: 2.4, x: -20 },
    { text: 'Send a message ✉️', delay: 3.6, x: 40 },
];

function FloatingBubbles() {
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {BUBBLES.map((b, i) => (
                <motion.div
                    key={i}
                    className="absolute bottom-0 px-3 py-1.5 bg-[#005c4b]/70 backdrop-blur-sm text-white text-xs rounded-full border border-emerald-500/20 shadow-lg"
                    style={{ left: `calc(50% + ${b.x}px)` }}
                    initial={{ opacity: 0, y: 0 }}
                    animate={{ opacity: [0, 1, 1, 0], y: [0, -180, -300, -420] }}
                    transition={{ duration: 6, delay: b.delay, repeat: Infinity, ease: 'easeOut' }}
                >
                    {b.text}
                </motion.div>
            ))}
        </div>
    );
}

/* ─── Main Export ──────────────────────────────────────────────────── */

export default function EmptyChatScene3D() {
    const [mounted, setMounted] = useState(false);
    const sceneLoaded = true; // Added sceneLoaded state
    useEffect(() => { setMounted(true); }, []);

    return (
        <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden bg-[#0b141a]">

            {/* Three.js Canvas */}
            <div className={`absolute inset-0 z-0 transition-opacity duration-1000 ${sceneLoaded ? 'opacity-100' : 'opacity-0'}`}>
                <Canvas camera={{ position: [0, 0, 5], fov: 55 }} gl={{ antialias: true, alpha: true }} dpr={[1, 2]} performance={{ min: 0.5 }}>
                    <Suspense fallback={null}>
                        <Scene3D />
                    </Suspense>
                </Canvas>
                {/* Vignette gradient */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: 'radial-gradient(ellipse at center, transparent 30%, #0b141a 85%)' }}
                />
            </div>

            {/* Floating bubbles */}
            <FloatingBubbles />

            {/* Subtle grid overlay */}
            <div
                className="absolute inset-0 z-0 pointer-events-none"
                style={{
                    backgroundImage: `
            linear-gradient(rgba(0,168,132,0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,168,132,0.07) 1px, transparent 1px)
          `,
                    backgroundSize: '40px 40px',
                }}
            />

            {/* Pulsing glow rings - toned down for elegance */}
            <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{ width: 480, height: 480, border: '1px solid rgba(0,168,132,0.05)' }}
                animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.05, 0.15] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
                className="absolute rounded-full pointer-events-none"
                style={{ width: 300, height: 300, border: '1px solid rgba(0,168,132,0.08)' }}
                animate={{ scale: [1.1, 1, 1.1], opacity: [0.05, 0.2, 0.05] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
            />

            {/* UI Content */}
            <AnimatePresence>
                {mounted && (
                    <motion.div
                        initial={{ opacity: 0, y: 40, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                        className="relative z-10 flex flex-col items-center text-center max-w-sm px-6"
                    >
                        {/* Floating icon badge */}
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                            className="mb-6 relative"
                        >
                            <div className="w-20 h-20 rounded-2xl bg-[#005c4b]/60 backdrop-blur-sm border border-emerald-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(0,168,132,0.3)]">
                                <MessageSquare size={36} className="text-emerald-400" />
                            </div>
                            {/* Ping rings */}
                            <motion.div
                                className="absolute inset-0 rounded-2xl border border-emerald-500/50"
                                animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
                            />
                            <motion.div
                                className="absolute inset-0 rounded-2xl border border-emerald-500/30"
                                animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                                transition={{ duration: 2, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
                            />
                        </motion.div>

                        {/* Title */}
                        <motion.h2
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25, duration: 0.6 }}
                            className="text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight"
                            style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5), 0 0 40px rgba(0,168,132,0.4)' }}
                        >
                            SparkChat
                        </motion.h2>

                        {/* Subtitle */}
                        <motion.p
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.38, duration: 0.6 }}
                            className="text-gray-200 font-medium text-base sm:text-lg mb-8 leading-relaxed"
                            style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}
                        >
                            Select a conversation or start a new one
                        </motion.p>

                        {/* E2E encryption notice */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.7 }}
                            className="flex items-center gap-1.5 text-[#8696a0] text-[11px]"
                        >
                            <Lock size={10} />
                            <span>Messages are end-to-end encrypted</span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
