import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Sprout } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [isAnimating, setIsAnimating] = useState(false);
  const [animatingTheme, setAnimatingTheme] = useState<string | null>(null);

  const handleToggle = () => {
    if (isAnimating) return;
    setAnimatingTheme(theme);
    setIsAnimating(true);
    
    // Start animation
    // The animation takes about 1.5s total
    // We toggle theme at 0.75s (halfway)
    setTimeout(() => {
      toggleTheme();
    }, 750);

    setTimeout(() => {
      setIsAnimating(false);
      setAnimatingTheme(null);
    }, 1500);
  };

  const overlayTheme = animatingTheme || theme;

  return (
    <>
      <button
        onClick={handleToggle}
        className="p-2 rounded-full bg-lime-100 dark:bg-lime-900/50 text-lime-800 dark:text-lime-100 hover:bg-lime-200 dark:hover:bg-lime-800 transition-colors relative overflow-hidden"
        title={theme === 'light' ? 'Σκοτεινό Θέμα' : 'Φωτεινό Θέμα'}
      >
        <AnimatePresence mode='wait'>
          {theme === 'light' ? (
            <motion.div
              key="moon"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Moon size={20} />
            </motion.div>
          ) : (
            <motion.div
              key="sun"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Sun size={20} />
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Full Screen Overlay Animation */}
      <AnimatePresence>
        {isAnimating && (
          <motion.div
            className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* The growing tree shape */}
            <motion.div
              initial={{ scale: 0, y: 500 }}
              animate={{ scale: [0, 5, 50], y: [500, 0, 0] }}
              transition={{ duration: 1.5, ease: "easeInOut", times: [0, 0.5, 1] }}
              className={`absolute text-lime-600 ${overlayTheme === 'light' ? 'text-slate-900' : 'text-slate-100'}`}
            >
                {/* We use a large filled circle to cover screen, but shaped like a tree canopy */}
                <div className={`w-96 h-96 rounded-full ${overlayTheme === 'light' ? 'bg-slate-900' : 'bg-lime-50'}`} />
            </motion.div>
            
            {/* Decorative Sprout Icon in center */}
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: [0, 1.5, 1.5, 0], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.5, times: [0, 0.4, 0.6, 1] }}
                className="absolute text-lime-500 z-[10000]"
            >
                <Sprout size={120} strokeWidth={1.5} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}