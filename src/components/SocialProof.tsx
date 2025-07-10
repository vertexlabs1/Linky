import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react';

const SocialProof = () => {
  return (
    <motion.div
      className="flex items-center gap-3 bg-card/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-card border border-primary/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.6 }}
    >
      <motion.div
        animate={{ 
          scale: [1, 1.1, 1],
          filter: [
            "drop-shadow(0 0 5px hsl(var(--primary) / 0.3))",
            "drop-shadow(0 0 15px hsl(var(--primary) / 0.5))",
            "drop-shadow(0 0 5px hsl(var(--primary) / 0.3))"
          ]
        }}
        transition={{ 
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="flex items-center gap-2"
      >
        <TrendingUp className="w-5 h-5 text-primary" />
        <span className="font-bold text-primary text-lg">134+</span>
      </motion.div>
      <span className="text-muted-foreground font-medium">Leads Generated</span>
    </motion.div>
  );
};

export default SocialProof;