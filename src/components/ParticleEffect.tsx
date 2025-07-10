import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
}

const ParticleEffect = () => {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const generateParticles = () => {
      const newParticles: Particle[] = [];
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * 100,
          y: Math.random() * 100,
          size: Math.random() * 4 + 1,
          duration: Math.random() * 10 + 10,
        });
      }
      setParticles(newParticles);
    };

    generateParticles();
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-primary/20"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
          }}
          animate={{
            y: [0, -20, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: particle.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2,
          }}
        />
      ))}
      
      {/* Neural Network Pattern */}
      <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 100 100">
        <defs>
          <pattern id="circuit" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
            <path
              d="M0 5h10M5 0v10"
              stroke="hsl(var(--primary))"
              strokeWidth="0.1"
              fill="none"
            />
            <circle cx="5" cy="5" r="0.5" fill="hsl(var(--primary))" />
          </pattern>
        </defs>
        <rect width="100" height="100" fill="url(#circuit)" />
      </svg>
    </div>
  );
};

export default ParticleEffect;