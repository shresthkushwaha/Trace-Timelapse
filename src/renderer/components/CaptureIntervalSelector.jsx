import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ChevronUp = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m18 15-6-6-6 6" />
    </svg>
);

const ChevronDown = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m6 9 6 6 6-6" />
    </svg>
);

const CaptureIntervalSelector = ({ value, unit, onChange, onUnitChange, disabled, label = "Capture Interval", variant = 'light' }) => {
    const isLight = variant === 'light';
    const textColor = isLight ? 'text-trace-dark' : 'text-trace-light';
    const bgColor = isLight ? 'bg-trace-light' : 'bg-trace-dark';

    // Label placement/color might differ slightly, but we'll try to unify
    // In design: Left panel label is at bottom, Middle panel label is at bottom.

    const handleIncrement = () => {
        if (disabled) return;
        onChange(value + 1);
    };

    const handleDecrement = () => {
        if (disabled || value <= 1) return;
        onChange(value - 1);
    };

    const getUnitLabel = () => {
        switch (unit) {
            case 'seconds': return 'Sec';
            case 'minutes': return 'Min';
            case 'hours': return 'Hr';
            default: return 'Sec';
        }
    };

    const toggleUnit = () => {
        if (disabled) return;
        const units = ['seconds', 'minutes', 'hours'];
        const currentIndex = units.indexOf(unit);
        const nextIndex = (currentIndex + 1) % units.length;
        onUnitChange(units[nextIndex]);
    };

    return (
        <div className={`flex flex-col items-center justify-center w-full h-full relative select-none ${bgColor} ${textColor}`}>
            {/* Up Arrow */}
            <div className="absolute top-[20px] left-0 right-0 flex justify-center z-20">
                <motion.button
                    onClick={handleIncrement}
                    disabled={disabled}
                    className="p-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Increase"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <ChevronUp className="w-8 h-8 text-trace-orange" />
                </motion.button>
            </div>

            {/* Value and Unit */}
            <div className="flex items-baseline gap-2 z-10 overflow-hidden relative" style={{ height: '120px' }}>
                <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                        key={value}
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -50, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className="text-[96px] leading-none font-normal tracking-tighter inline-block"
                    >
                        {value}
                    </motion.span>
                </AnimatePresence>

                <motion.button
                    onClick={toggleUnit}
                    disabled={disabled}
                    className={`text-[32px] font-normal cursor-pointer hover:opacity-70 disabled:cursor-not-allowed ${textColor}`}
                    title="Click to change unit"
                    layout
                >
                    <AnimatePresence mode="wait">
                        <motion.span
                            key={unit}
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -10, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="inline-block"
                        >
                            {getUnitLabel()}
                        </motion.span>
                    </AnimatePresence>
                </motion.button>
            </div>

            {/* Down Arrow */}
            <div className="absolute bottom-[60px] left-0 right-0 flex justify-center z-20">
                <motion.button
                    onClick={handleDecrement}
                    disabled={disabled || value <= 1}
                    className="p-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Decrease"
                    whileHover={{ scale: 1.1, y: 2 }}
                    whileTap={{ scale: 0.9 }}
                >
                    <ChevronDown className="w-8 h-8 text-trace-orange" />
                </motion.button>
            </div>

            {/* Label */}
            <div className={`absolute bottom-[30px] left-4 text-[14px] font-normal ${textColor} opacity-60`}>
                {label}
            </div>
        </div>
    );
};

export default CaptureIntervalSelector;
