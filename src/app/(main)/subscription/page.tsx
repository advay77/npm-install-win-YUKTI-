"use client";
import React, { useEffect, useRef } from "react";
import { useTheme } from "@/context/ThemeProvider";

const ParticleCanvas = ({ darkTheme }: { darkTheme: boolean }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouseRef = useRef({ x: 0, y: 0, active: false });

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let animationFrameId: number;
        let particles: Particle[] = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };

        class Particle {
            x: number;
            y: number;
            baseX: number;
            baseY: number;
            size: number;
            speedX: number;
            speedY: number;
            opacity: number;

            constructor() {
                this.x = 0;
                this.y = 0;
                this.baseX = 0;
                this.baseY = 0;
                this.size = 0;
                this.speedX = 0;
                this.speedY = 0;
                this.opacity = 0;
                this.init();
            }

            init() {
                if (!canvas) return;
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.baseX = this.x;
                this.baseY = this.y;
                this.size = Math.random() * 1.5 + 0.5;
                this.speedX = Math.random() * 0.4 - 0.2;
                this.speedY = Math.random() * 0.4 - 0.2;
                this.opacity = Math.random() * 0.6 + 0.1;
            }

            update() {
                if (!canvas) return;
                this.x += this.speedX;
                this.y += this.speedY;

                if (mouseRef.current.active) {
                    const dx = mouseRef.current.x - this.x;
                    const dy = mouseRef.current.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < 150) {
                        this.x -= dx * 0.02;
                        this.y -= dy * 0.02;
                    }
                }

                if (this.x > canvas.width) this.x = 0;
                if (this.x < 0) this.x = canvas.width;
                if (this.y > canvas.height) this.y = 0;
                if (this.y < 0) this.y = canvas.height;
            }

            draw() {
                if (!ctx) return;
                ctx.fillStyle = darkTheme ? `rgba(255, 255, 255, ${this.opacity})` : `rgba(0, 0, 0, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const setup = () => {
            resize();
            particles = [];
            const count = window.innerWidth < 768 ? 80 : 150;
            for (let i = 0; i < count; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach((p) => {
                p.update();
                p.draw();
            });
            animationFrameId = requestAnimationFrame(animate);
        };

        const handleMouseMove = (e: MouseEvent) => {
            mouseRef.current = { x: e.clientX, y: e.clientY, active: true };
        };

        const handleMouseLeave = () => {
            mouseRef.current.active = false;
        };

        window.addEventListener('resize', resize);
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);
        setup();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            cancelAnimationFrame(animationFrameId);
        };
    }, [darkTheme]);

    return <canvas ref={canvasRef} className="absolute inset-0 z-0 pointer-events-none" />;
};

const SubscriptionPage = () => {
    const { darkTheme } = useTheme();

    return (
        <div
            className={`h-screen w-full flex flex-col items-center justify-center overflow-hidden select-none relative ${darkTheme ? "bg-black text-white" : "bg-white text-black"
                }`}
        >
            <ParticleCanvas darkTheme={darkTheme} />

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-[1]">
                <div
                    className={`w-[60vw] h-[60vw] rounded-full blur-[140px] opacity-30 ${darkTheme
                        ? "bg-blue-950 shadow-[0_0_80px_rgba(30,58,138,0.4)]"
                        : "bg-slate-200 shadow-[0_0_80px_rgba(100,116,139,0.3)]"
                        }`}
                ></div>
            </div>

            <div className="relative z-[2] text-center flex flex-col items-center pointer-events-none">
                <div className="overflow-hidden h-6 mb-2">
                    <p
                        className={`text-[10px] md:text-xs font-bold tracking-[0.6em] uppercase animate-slide-up ${darkTheme ? "text-white/40" : "text-black/30"
                            }`}
                    >
                        Handcrafting something new
                    </p>
                </div>

                <div className="relative leading-[0.85] select-none">
                    <h1
                        className={`text-8xl md:text-[220px] font-black tracking-tighter ${darkTheme ? "text-white" : "text-black"
                            }`}
                    >
                        COMING
                    </h1>
                    <h1
                        className={`text-8xl md:text-[220px] font-black tracking-tighter outline-text -mt-2 md:-mt-10 ${darkTheme ? "text-transparent stroke-white" : "text-transparent stroke-black"
                            }`}
                    >
                        SOON
                    </h1>
                </div>

                <div
                    className={`mt-12 w-12 h-[1px] ${darkTheme ? "bg-white/20" : "bg-black/20"
                        }`}
                ></div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .outline-text {
          -webkit-text-stroke: 1px currentColor;
        }

        @media (min-width: 768px) {
          .outline-text {
            -webkit-text-stroke: 3px currentColor;
          }
        }

        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .animate-slide-up {
          animation: slideUp 2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
        </div>
    );
};

export default SubscriptionPage;
