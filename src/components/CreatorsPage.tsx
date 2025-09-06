// src/components/CreatorsPage.tsx
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface Creator {
  name: string;
  role: string;
  imageUrl: string;
}

const creators: Creator[] = [
  {
    name: 'Aditya',
    role: 'FULL STACK DEVELOPER',
    imageUrl: 'https://avatars.githubusercontent.com/u/101815393?v=4',
  },
  {
    name: 'Vijay',
    role: 'Frontend Developer',
    imageUrl: 'https://avatars.githubusercontent.com/u/101815393?v=4',
  },
  {
    name: 'vidya sagar reddy',
    role: 'FULL STACK DEVELOPER',
    imageUrl: 'https://avatars.githubusercontent.com/u/101815393?v=4',
  },
];

interface CreatorsPageProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreatorsPage: React.FC<CreatorsPageProps> = ({ isOpen, onClose }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with a blur effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm transition-opacity duration-300"
            aria-hidden="true"
          />

          {/* This is the panel that slides in from the right */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            // Adjusted positioning and sizing for a slightly larger horizontal popup
            className="fixed top-1/2 -translate-y-1/2 right-0 w-[350px] h-[80px] bg-red-700 rounded-l-xl shadow-2xl z-50 flex flex-row items-center justify-between overflow-hidden"
          >
            {/* NEW: Close button is now on the right side */}

            {/* NEW: Horizontal scrollable area for creator cards */}
            <div className="flex-1 flex flex-row items-center overflow-x-auto custom-scrollbar-horizontal space-x-2 pl-2 pr-2">
              {creators.map((creator, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  // NEW: Compact horizontal card style
                  className="flex items-center space-x-1 bg-white dark:bg-gray-800 rounded-full px-2 py-1 shadow-sm flex-shrink-0"
                >
                  <img
                    src={creator.imageUrl}
                    alt={creator.name}
                    className="w-8 h-8 rounded-full object-cover border-1 border-red-300"
                  />
                  <div className="flex flex-col text-left leading-tight">
                    <h3 className="text-xs font-semibold text-gray-900 dark:text-white">{creator.name}</h3>
                    <p className="text-[10px] text-gray-600 dark:text-gray-400">{creator.role}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            {/* Close button moved to the far right for visual balance */}
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 transition-colors flex-shrink-0"
              aria-label="Close creators page"
            >
              <X size={20} />
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CreatorsPage;
