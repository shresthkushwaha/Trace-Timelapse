import React, { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import InitialScreen from './components/InitialScreen';
import TimerSetupScreen from './components/TimerSetupScreen';
import ManualSetupScreen from './components/ManualSetupScreen';
import TimerActiveScreen from './components/TimerActiveScreen';
import ManualActiveScreen from './components/ManualActiveScreen';

function App() {
    // --- State ---
    const [activeScreen, setActiveScreen] = useState('initial'); // initial, timerSetup, manualSetup, timerActive, manualActive

    // Settings
    const [captureInterval, setCaptureInterval] = useState(5);
    const [intervalUnit, setIntervalUnit] = useState('sec'); // 'sec', 'min'

    const [sessionDuration, setSessionDuration] = useState(30);
    const [durationUnit, setDurationUnit] = useState('min'); // 'min', 'hours'

    const [targetFPS, setTargetFPS] = useState(12);
    const [savePath, setSavePath] = useState('');

    // Capture State
    const [status, setStatus] = useState('Idle');
    const [isCapturing, setIsCapturing] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const startTimeRef = useRef(null);

    // --- Effects ---

    // Handle Window Resizing based on Screen
    useEffect(() => {
        const sizes = {
            initial: { width: 1290, height: 510 },
            timerSetup: { width: 1290, height: 510 },
            manualSetup: { width: 1290, height: 510 },
            timerActive: { width: 1290, height: 510 },
            manualActive: { width: 1290, height: 510 }
        };

        const size = sizes[activeScreen] || { width: 445, height: 400 };

        // Call resize immediately; main process handles smoothing
        window.electron.resizeWindow(size);
    }, [activeScreen]);

    // Initial Window Size (redundant with above, but keeps startup safe)
    useEffect(() => {
        window.electron.resizeWindow({ width: 1290, height: 510 });
    }, []);

    // Listen for status updates from main process
    useEffect(() => {
        const handleStatusUpdate = (data) => {
            setStatus(data.status);

            if (data.status === 'Stopped' || data.status === 'Done' || data.status === 'Idle') {
                if (isCapturing) {
                    setIsCapturing(false);
                    setIsPaused(false);
                    setActiveScreen('initial');
                }
            }
        };

        const cleanup = window.electron.onStatusUpdate(handleStatusUpdate);
        return () => { };
    }, [isCapturing]);

    // Timer logic for UI
    useEffect(() => {
        let interval;
        if (isCapturing && !isPaused) {
            if (!startTimeRef.current) {
                startTimeRef.current = Date.now() - elapsedTime;
            }
            interval = setInterval(() => {
                setElapsedTime(Date.now() - startTimeRef.current);
            }, 100);
        } else {
            if (!isPaused) {
                startTimeRef.current = null;
                setElapsedTime(0);
            }
        }
        return () => clearInterval(interval);
    }, [isCapturing, isPaused]);

    // --- Handlers ---

    const handleSelectSaveLocation = async () => {
        const path = await window.electron.selectSaveLocation();
        if (path) {
            setSavePath(path);
        }
    };

    const handleStartCapture = async (mode) => {
        if (!savePath) {
            alert('Please select a save location first!');
            return;
        }

        const isInfinite = mode === 'manual';

        // Calculate Interval in ms
        let intervalMs = captureInterval * 1000;
        if (intervalUnit === 'min') {
            intervalMs = captureInterval * 60 * 1000;
        }

        // Calculate Duration in ms
        let durationMs = sessionDuration * 60 * 1000; // default min
        if (durationUnit === 'hours') {
            durationMs = sessionDuration * 60 * 60 * 1000;
        }

        setIsCapturing(true);
        setElapsedTime(0);
        setIsPaused(false);
        startTimeRef.current = Date.now();

        // Transition to active screen
        setActiveScreen(mode === 'timer' ? 'timerActive' : 'manualActive');

        const result = await window.electron.startCapture({
            intervalMs,
            durationMs,
            isInfinite,
            targetFPS,
            savePath,
        });

        if (!result.success) {
            alert('Failed to start capture: ' + result.error);
            setIsCapturing(false);
            setActiveScreen('initial');
        }
    };

    const handleStopCapture = async () => {
        const result = await window.electron.stopCapture({ targetFPS });
        if (!result.success) {
            alert('Failed to stop capture: ' + result.error);
        }
        // State update handled by IPC 'Stopped' event usually, but we can optimise UX
        setIsCapturing(false);
        setActiveScreen('initial');
    };

    const handlePauseCapture = () => {
        if (isPaused) {
            window.electron.resumeCapture();
        } else {
            window.electron.pauseCapture();
        }
        setIsPaused(!isPaused);
    };

    // --- Render ---

    const renderScreen = () => {
        switch (activeScreen) {
            case 'initial':
                return (
                    <InitialScreen
                        onManualSelect={() => setActiveScreen('manualSetup')}
                        onTimerSelect={() => setActiveScreen('timerSetup')}
                    />
                );
            case 'timerSetup':
                return (
                    <TimerSetupScreen
                        interval={captureInterval}
                        setInterval={setCaptureInterval}
                        intervalUnit={intervalUnit}
                        setIntervalUnit={setIntervalUnit}
                        duration={sessionDuration}
                        setDuration={setSessionDuration}
                        durationUnit={durationUnit}
                        setDurationUnit={setDurationUnit}
                        fps={targetFPS}
                        setFps={setTargetFPS}
                        onStart={() => handleStartCapture('timer')}
                        onBack={() => setActiveScreen('initial')}
                        onChooseFolder={handleSelectSaveLocation}
                        savePath={savePath}
                    />
                );
            case 'manualSetup':
                return (
                    <ManualSetupScreen
                        interval={captureInterval}
                        setInterval={setCaptureInterval}
                        intervalUnit={intervalUnit}
                        setIntervalUnit={setIntervalUnit}
                        fps={targetFPS}
                        setFps={setTargetFPS}
                        onStart={() => handleStartCapture('manual')}
                        onBack={() => setActiveScreen('initial')}
                        onChooseFolder={handleSelectSaveLocation}
                        savePath={savePath}
                    />
                );
            case 'timerActive':
                return (
                    <TimerActiveScreen
                        remainingTime={(sessionDuration * 60 * 1000) - elapsedTime}
                        totalDuration={sessionDuration * 60 * 1000}
                        onStop={handleStopCapture}
                        onPause={handlePauseCapture}
                        isPaused={isPaused}
                    />
                );
            case 'manualActive':
                return (
                    <ManualActiveScreen
                        elapsedTime={elapsedTime}
                        onStop={handleStopCapture}
                        onPause={handlePauseCapture}
                        isPaused={isPaused}
                    />
                );
            default:
                return <div>Unknown Screen</div>;
        }
    };

    return (
        <div className="w-screen h-screen font-sans overflow-hidden bg-black">
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeScreen}
                    className="w-full h-full relative"
                >
                    {/* Screen Content */}
                    <motion.div
                        className="w-full h-full"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        {renderScreen()}
                    </motion.div>

                    {/* Exit Curtain (Slides in from Right to Center) */}
                    <motion.div
                        className="absolute inset-0 bg-[#EC642B] z-[50]"
                        initial={{ x: "100%" }}
                        exit={{ x: "0%" }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    />

                    {/* Entry Curtain (Slides out from Center to Left) */}
                    <motion.div
                        className="absolute inset-0 bg-[#EC642B] z-[50]"
                        initial={{ x: "0%" }}
                        animate={{ x: "-100%" }}
                        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    />
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

export default App;
