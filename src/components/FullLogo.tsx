import { motion } from 'framer-motion';

interface FullLogoProps {
  size?: 'large' | 'small';
  className?: string;
  animate?: boolean;
}

const FullLogo = ({ size = 'large', className = '', animate = false }: FullLogoProps) => {
  const isLarge = size === 'large';
  
  const containerVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05 },
    flying: {
      scale: [1, 1.2, 0.6],
      x: [0, -20, 0],
      y: [0, -10, 0],
      rotate: [0, 5, -2, 0],
    }
  };

  const flyingTransition = {
    duration: 0.8,
    ease: [0.4, 0, 0.2, 1] as [number, number, number, number]
  };

  const logoVariants = {
    initial: { 
      filter: "drop-shadow(0 0 20px hsl(var(--primary) / 0.4))",
    },
    hover: {
      filter: "drop-shadow(0 0 30px hsl(var(--primary) / 0.6))",
      transition: { duration: 0.3 }
    }
  };

  const textVariants = {
    initial: { 
      textShadow: "0 0 20px hsl(var(--primary) / 0.5)",
    },
    hover: {
      textShadow: "0 0 30px hsl(var(--primary) / 0.7)",
      transition: { duration: 0.3 }
    }
  };

  return (
    <motion.div
      className={`flex items-center gap-4 ${className}`}
      variants={containerVariants}
      initial="initial"
      whileHover="hover"
      animate={animate ? "flying" : "initial"}
      transition={animate ? flyingTransition : undefined}
    >
      {/* Robot Mascot */}
      <motion.img
        src="/lovable-uploads/04fea3ee-d055-40e5-9dae-0428d4e3487b.png"
        alt="Linky Robot"
        className="object-contain"
        style={{
          width: isLarge ? '120px' : '60px',
          height: isLarge ? '120px' : '60px',
        }}
        variants={logoVariants}
      />
      
      {/* Linky Text */}
      <motion.h1
        className={`font-bold text-foreground ${
          isLarge ? 'text-6xl lg:text-7xl' : 'text-2xl'
        }`}
        variants={textVariants}
      >
        Linky
      </motion.h1>
    </motion.div>
  );
};

export default FullLogo;