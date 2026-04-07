import React from 'react';
import { motion } from 'framer-motion';

const InitialScreen = ({ onManualSelect, onTimerSelect }) => {
    return (
        <div className="w-full h-full relative bg-white overflow-hidden flex flex-col font-sans select-none">
            {/* Manual Button (Top Half) */}
            <motion.button
                onClick={onManualSelect}
                className="w-full h-1/2 flex items-center justify-center relative group overflow-hidden"
                initial={{ backgroundColor: "#EAE9E5", color: "#1E1E1E" }}
                whileHover={{ backgroundColor: "#EC642B", color: "#FFFFFF" }}
                whileTap={{ scale: 1 }} // Keep button stable, animate text
                transition={{ duration: 0.3 }}
            >
                <motion.span
                    className="font-sans font-medium text-[64px] relative z-10"
                    initial={{ scale: 1, y: 0, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    Manual
                </motion.span>
            </motion.button>

            {/* Timer Button (Bottom Half) */}
            <motion.button
                onClick={onTimerSelect}
                className="w-full h-1/2 flex items-center justify-center relative group overflow-hidden"
                initial={{ backgroundColor: "#1E1E1E", color: "#EAE9E5" }}
                whileHover={{ backgroundColor: "#EC642B", color: "#FFFFFF" }}
                whileTap={{ scale: 1 }}
                transition={{ duration: 0.3 }}
            >
                <motion.span
                    className="font-sans font-medium text-[64px] relative z-10"
                    initial={{ scale: 1, y: 0, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                    Timer
                </motion.span>
            </motion.button>
        </div>
    );
};

export default InitialScreen;
