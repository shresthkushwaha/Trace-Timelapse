import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ManualActiveScreen = ({
    elapsedTime,
    onStop,
    onPause,
    isPaused
}) => {
    // Format elapsed time MM:SS
    const totalSeconds = Math.floor(elapsedTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

    return (
        <div className="w-full h-full relative bg-white overflow-hidden flex flex-col font-sans select-none">
            {/* Timer Display */}
            <div className="flex-1 flex flex-col items-center justify-center">
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                        key={formattedTime}
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="text-[115px] font-cabinet font-normal text-trace-orange leading-none"
                    >
                        {formattedTime}
                    </motion.span>
                </AnimatePresence>
                <span className="text-[24px] font-cabinet font-normal text-trace-orange mt-2 opacity-80">
                    Min
                </span>
            </div>

            {/* Toggle Controls (Stop/Pause) */}
            <div className="flex h-[80px]">
                <motion.button
                    onClick={onStop}
                    className="flex-1 bg-trace-dark text-trace-light text-[32px] font-medium hover:bg-black transition-colors"
                    whileHover={{ backgroundColor: "#000000" }}
                    whileTap={{ scale: 0.98 }}
                >
                    Stop
                </motion.button>
                <motion.button
                    onClick={onPause}
                    className="flex-1 bg-trace-light text-trace-dark text-[32px] font-medium hover:bg-[#dcdcd0] transition-colors"
                    whileHover={{ backgroundColor: "#dcdcd0" }}
                    whileTap={{ scale: 0.98 }}
                >
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.span
                            key={isPaused ? 'Resume' : 'Pause'}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -20, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="block"
                        >
                            {isPaused ? 'Resume' : 'Pause'}
                        </motion.span>
                    </AnimatePresence>
                </motion.button>
            </div>
        </div>
    );
};

export default ManualActiveScreen;
