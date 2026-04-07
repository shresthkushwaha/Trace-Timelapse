import React from 'react';

const ActiveSessionView = ({
    duration, // in ms
    elapsed, // in ms
    unit = 'minutes',
    onStop
}) => {
    // Calculate remaining time
    const remainingMs = Math.max(0, duration - elapsed);

    // Calculate percentage for the ring
    // If it's infinite, maybe we just spin it or show full?
    // Assuming finite duration for the ring for now based on "30 Min" design.
    // If infinite, we might handle differently, but let's stick to the design for finite.
    const percentage = Math.min(100, Math.max(0, (elapsed / duration) * 100));

    // Formatting logic
    let displayValue;
    let displayUnit;

    // We stick to the user's selected unit for the big number display if possible, 
    // or we auto-scale. The design shows "30 Min". 
    // Let's try to verify what the user selected.

    if (unit === 'hours') {
        const hours = Math.ceil(remainingMs / (60 * 60 * 1000));
        displayValue = hours;
        displayUnit = 'Hr';
    } else if (unit === 'minutes') {
        const minutes = Math.ceil(remainingMs / (60 * 1000));
        displayValue = minutes;
        displayUnit = 'Min';
    } else {
        const seconds = Math.ceil(remainingMs / 1000);
        displayValue = seconds;
        displayUnit = 'Sec';
    }

    // Circular Progress Constants
    const size = 300;
    const strokeWidth = 8;
    const center = size / 2;
    const radius = size / 2 - strokeWidth * 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-between w-full h-full relative bg-trace-light">
            {/* Morphing Container Content */}

            {/* Timer Section */}
            <div className="flex-1 flex flex-col items-center justify-center relative w-full min-h-0">

                {/* SVG Ring */}
                {/* 
                   The design shows the ring starts at the top (rotate-[-90deg]).
                   Background track is Black (trace-dark).
                   Progress is Orange (trace-orange).
                */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg
                        width={size}
                        height={size}
                        viewBox={`0 0 ${size} ${size}`}
                        className="transform -rotate-90"
                    >
                        {/* Background Ring (Full) */}
                        <circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={strokeWidth}
                            className="text-trace-dark"
                        />
                        {/* Progress Ring */}
                        <circle
                            cx={center}
                            cy={center}
                            r={radius}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={strokeWidth}
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            className="text-trace-orange transition-all duration-1000 ease-linear"
                        />
                    </svg>
                </div>

                {/* Text Display */}
                <div className="flex flex-col items-center z-10 mt-4">
                    <span className="text-[115px] font-normal leading-none text-trace-dark font-sans" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {displayValue}
                    </span>
                    <span className="text-[24px] font-normal text-trace-dark mt-[-10px]">
                        {displayUnit}
                    </span>
                </div>
            </div>

            {/* Stop Button */}
            <button
                onClick={onStop}
                className="w-full h-[100px] bg-trace-dark text-trace-light text-[32px] font-medium hover:bg-black transition-colors flex items-center justify-center shrink-0 z-20 cursor-pointer"
            >
                Stop Capture
            </button>
        </div>
    );
};

export default ActiveSessionView;
