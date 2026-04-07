import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const TimerActiveScreen = ({
    remainingTime,
    totalDuration,
    onStop,
    onPause,
    isPaused
}) => {
    // Calculate circular progress
    const percentage = Math.min(100, Math.max(0, ((totalDuration - remainingTime) / totalDuration) * 100));
    const size = 260;
    const strokeWidth = 8;
    const center = size / 2;
    const radius = size / 2 - strokeWidth * 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    // Format time
    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);
    const displayValue = minutes > 0 ? minutes : seconds;
    const displayUnit = minutes > 0 ? 'Min' : 'Sec';

    return (
        <div className="w-full h-full relative bg-white overflow-hidden flex flex-col font-sans select-none">
            {/* Timer Display */}
            <div className="flex-1 flex items-center justify-center relative">
                {/* SVG Ring */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                        {/* Background Ring */}
                        <circle cx={center} cy={center} r={radius} fill="none" stroke="#1e1e1e" strokeWidth={strokeWidth} />
                        {/* Progress Ring */}
                        <motion.circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="none"
                            stroke="#ec642b"
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeLinecap="round"
                            initial={{ strokeDashoffset: circumference }}
                            animate={{ strokeDashoffset }}
                            transition={{ duration: 0.5, ease: "linear" }}
                        />
                    </svg>
                </div>

                <div className="flex flex-col items-center z-10">
                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.span
                            key={displayValue}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            className="text-[115px] font-cabinet font-normal text-trace-dark leading-none"
                        >
                            {displayValue}
                        </motion.span>
                    </AnimatePresence>
                    <span className="text-[24px] font-cabinet font-normal text-trace-dark opacity-60">
                        {displayUnit}
                    </span>
                </div>
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

export default TimerActiveScreen;
