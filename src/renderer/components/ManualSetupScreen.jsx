import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ManualSetupScreen = ({
    interval, setInterval,
    intervalUnit, setIntervalUnit,
    fps, setFps,
    onStart,
    onBack,
    onChooseFolder,
    savePath
}) => {
    return (
        <div className="w-full h-full relative bg-white overflow-hidden flex flex-col font-sans select-none">
            <div className="flex-1 flex flex-row min-h-0">
                {/* Left: Capture Interval (Light) */}
                <div className="w-[30%] bg-[#EAE9E5] relative flex flex-col items-center justify-center border-r-[1px] border-trace-dark/5 shrink-0">
                    <motion.button
                        onClick={onBack}
                        className="absolute top-6 left-6 z-50 text-trace-dark focus:outline-none"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </motion.button>

                    <div className="flex flex-col items-center justify-center h-full relative w-full pt-10">
                        <motion.button
                            onClick={() => setInterval(prev => Math.min(60, prev + 1))}
                            className="text-[#EC642B] p-2 mb-2 focus:outline-none"
                            whileHover={{ scale: 1.2, y: -2 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6" /></svg>
                        </motion.button>

                        <div className="relative flex items-center justify-center">
                            <div className="flex flex-col items-center relative h-[120px] justify-center overflow-hidden w-[200px]">
                                <AnimatePresence mode="popLayout" initial={false}>
                                    <motion.span
                                        key={interval}
                                        initial={{ y: 50, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        exit={{ y: -50, opacity: 0 }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                        className="text-[120px] font-normal text-[#1E1E1E] leading-[0.9] font-cabinet tracking-tight block text-center w-full"
                                    >
                                        {interval}
                                    </motion.span>
                                </AnimatePresence>
                            </div>

                            {/* Unit Selector (Min / Sec) */}
                            <div className="flex flex-col items-start absolute -right-4 top-1/2 -translate-y-1/2 gap-1 translate-x-full">
                                <motion.button
                                    onClick={() => setIntervalUnit('min')}
                                    className={`text-[24px] font-cabinet font-normal leading-none transition-colors ${intervalUnit === 'min' ? 'text-[#1E1E1E]' : 'text-[#1E1E1E]/20 hover:text-[#1E1E1E]/50'}`}
                                    whileHover={{ scale: 1.05, x: 2 }}
                                >
                                    Min
                                </motion.button>
                                <motion.button
                                    onClick={() => setIntervalUnit('sec')}
                                    className={`text-[24px] font-cabinet font-normal leading-none transition-colors ${intervalUnit === 'sec' ? 'text-[#1E1E1E]' : 'text-[#1E1E1E]/20 hover:text-[#1E1E1E]/50'}`}
                                    whileHover={{ scale: 1.05, x: 2 }}
                                >
                                    Sec
                                </motion.button>
                            </div>
                        </div>

                        <motion.button
                            onClick={() => setInterval(prev => Math.max(1, prev - 1))}
                            className="text-[#EC642B] p-2 mt-4 focus:outline-none"
                            whileHover={{ scale: 1.2, y: 2 }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                        </motion.button>
                    </div>

                    <span className="text-[16px] font-normal text-[#1E1E1E]/80 absolute bottom-8 left-8 font-cabinet">
                        Capture Interval
                    </span>
                </div>

                {/* Right: Settings (White) */}
                <div className="flex-1 bg-white relative flex flex-col min-w-0">
                    <div className="absolute top-8 right-8">
                        <motion.button
                            onClick={onChooseFolder}
                            className="px-6 py-2 border border-[#1E1E1E] rounded-[8px] text-[#1E1E1E] text-sm flex items-center justify-center min-w-[140px] truncate"
                            title={savePath || "No folder selected"}
                            whileHover={{ scale: 1.02, backgroundColor: "rgba(0,0,0,0.05)" }}
                            whileTap={{ scale: 0.98 }}
                        >
                            {savePath ? 'Folder Selected' : 'Choose Folder'}
                        </motion.button>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center w-full px-16 mt-8">
                        <div className="flex items-baseline mb-8 h-[100px] overflow-hidden">
                            <AnimatePresence mode="popLayout" initial={false}>
                                <motion.span
                                    key={fps}
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    exit={{ y: -20, opacity: 0 }}
                                    className="text-[120px] font-normal text-[#1E1E1E] leading-[0.8] font-cabinet tracking-tight block"
                                >
                                    {fps}
                                </motion.span>
                            </AnimatePresence>
                            <span className="text-[24px] text-[#1E1E1E]/60 ml-2 font-cabinet">fps</span>
                        </div>

                        <div className="w-full h-[3px] bg-[#1E1E1E] relative flex items-center group cursor-pointer">
                            <motion.div
                                className="absolute left-0 top-0 h-full bg-[#EC642B]"
                                animate={{ width: `${(fps / 60) * 100}%` }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                            <input
                                type="range"
                                min="1"
                                max="60"
                                value={fps}
                                onChange={(e) => setFps(parseInt(e.target.value))}
                                className="absolute w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <motion.div
                                className="w-5 h-5 bg-[#EC642B] rounded-full absolute -ml-2.5 pointer-events-none"
                                animate={{ left: `${(fps / 60) * 100}%` }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                style={{ top: '50%', y: '-50%' }}
                                whileHover={{ scale: 1.5 }}
                            />
                        </div>
                    </div>

                    {/* Estimates Row */}
                    <div className="flex justify-between items-end px-12 pb-12 w-full opacity-50 grayscale">
                        <div className="flex flex-col items-center w-1/3">
                            <span className="text-[28px] font-normal text-[#1E1E1E] font-cabinet mb-1">--:--</span>
                            <span className="text-[11px] text-[#EC642B] font-medium tracking-wide">Video Length</span>
                        </div>
                        <div className="flex flex-col items-center w-1/3">
                            <span className="text-[28px] font-normal text-[#1E1E1E] font-cabinet mb-1">--</span>
                            <span className="text-[11px] text-[#EC642B] font-medium tracking-wide">Frames</span>
                        </div>
                        <div className="flex flex-col items-center w-1/3">
                            <span className="text-[28px] font-normal text-[#1E1E1E] font-cabinet mb-1">-- MB</span>
                            <span className="text-[11px] text-[#EC642B] font-medium tracking-wide">Est. File Size</span>
                        </div>
                    </div>
                </div>
            </div>

            <motion.button
                onClick={onStart}
                className="w-full h-[90px] bg-[#EC642B] text-white text-[40px] font-normal flex items-center justify-center shrink-0 font-cabinet relative overflow-hidden"
                whileHover={{ scale: 1.0, backgroundColor: "#D65A26" }}
                whileTap={{ scale: 0.98 }}
                initial={{ y: 0 }}
            >
                <motion.div
                    className="absolute inset-0 bg-white/10"
                    initial={{ x: '-100%' }}
                    whileHover={{ x: '100%' }}
                    transition={{ duration: 0.5 }}
                />
                Start Capture
            </motion.button>
        </div>
    );
};

export default ManualSetupScreen;
