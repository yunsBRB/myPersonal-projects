'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library';
import { motion, AnimatePresence } from 'framer-motion';
import { Image as ImageIcon, Keyboard, Zap, Scan } from 'lucide-react';

export default function ScanPage() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [showGuide, setShowGuide] = useState(true);
    const [torchEnabled, setTorchEnabled] = useState(false);
    const [scanned, setScanned] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Hide guide text after 3 seconds
        const timer = setTimeout(() => setShowGuide(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        let codeReader: BrowserMultiFormatReader | null = null;
        let isComponentMounted = true;

        async function setupCamera() {
            // In @zxing/browser, we actually use the library directly
            codeReader = new BrowserMultiFormatReader();
            try {
                const videoInputDevices = await codeReader.listVideoInputDevices();
                if (videoInputDevices.length > 0) {
                    setHasPermission(true);

                    // Try to select the back camera
                    let selectedDeviceId = videoInputDevices[0].deviceId;
                    const backCamera = videoInputDevices.find(device =>
                        device.label.toLowerCase().includes('back') ||
                        device.label.toLowerCase().includes('environment')
                    );
                    if (backCamera) {
                        selectedDeviceId = backCamera.deviceId;
                    }

                    if (videoRef.current && isComponentMounted) {
                        codeReader.decodeFromVideoDevice(
                            selectedDeviceId,
                            videoRef.current,
                            (result, err) => {
                                if (result && !scanned) {
                                    setScanned(true);
                                    // Flash green & vibrate
                                    if (navigator.vibrate) {
                                        navigator.vibrate([100, 50, 100]);
                                    }

                                    // Redirect to product result
                                    setTimeout(() => {
                                        router.push(`/app/product/${result.getText()}`);
                                    }, 500); // 500ms delay to see the flash success
                                }

                                if (err && !(err instanceof NotFoundException)) {
                                    console.error('Scan Error', err);
                                }
                            }
                        );
                    }
                } else {
                    setHasPermission(false);
                }
            } catch (err) {
                console.error(err);
                setHasPermission(false);
            }
        }

        setupCamera();

        return () => {
            isComponentMounted = false;
            if (codeReader) {
                codeReader.reset();
            }
        };
    }, [router, scanned]);

    const toggleTorch = async () => {
        // Torch is complex to toggle reliably across all mobile browsers with zxing alone,
        // usually requires accessing the video track constraints directly.
        try {
            if (!videoRef.current || !videoRef.current.srcObject) return;
            const stream = videoRef.current.srcObject as MediaStream;
            const track = stream.getVideoTracks()[0];
            const imageCapture = new (window as any).ImageCapture(track);
            const photoCapabilities = await imageCapture.getPhotoCapabilities();

            if (photoCapabilities.fillLightMode?.includes('flash')) {
                await track.applyConstraints({
                    advanced: [{ torch: !torchEnabled }] as any
                });
                setTorchEnabled(!torchEnabled);
            }
        } catch (err) {
            console.warn('Torch not supported', err);
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col justify-between">
            {/* Viewfinder Camera Area */}
            <div className="absolute inset-0 overflow-hidden flex items-center justify-center">
                {hasPermission === false && (
                    <div className="text-white text-center p-6 z-10">
                        <h2 className="text-xl font-bold mb-2">Caméra inaccessible</h2>
                        <p className="text-sm opacity-80">Veuillez autoriser l'accès à la caméra pour scanner les codes-barres.</p>
                    </div>
                )}

                <video
                    ref={videoRef}
                    className="min-w-full min-h-full object-cover"
                    playsInline
                />

                {/* Animated Scan Overlay */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className={`relative w-64 h-40 border-2 rounded-xl transition-colors duration-300 ${scanned ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.5)] bg-green-500/10' : 'border-white/50'}`}>
                        {/* Corners */}
                        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg"></div>
                        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg"></div>
                        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg"></div>
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg"></div>

                        {/* Scanline */}
                        {!scanned && (
                            <motion.div
                                className="w-full h-0.5 bg-primary shadow-[0_0_8px_rgba(26,122,74,0.8)]"
                                animate={{ y: [0, 156, 0] }}
                                transition={{ repeat: Infinity, duration: 2.5, ease: "linear" }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Top Bar Navigation / Controls */}
            <div className="relative z-10 flex justify-between items-start p-6 pt-12">
                <button className="w-12 h-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white" onClick={() => router.back()}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
                </button>
                <button
                    className={`w-12 h-12 rounded-full backdrop-blur-md flex items-center justify-center transition-colors ${torchEnabled ? 'bg-primary text-white' : 'bg-black/40 text-white'}`}
                    onClick={toggleTorch}
                >
                    <Zap className="w-6 h-6" />
                </button>
            </div>

            {/* Guide Text */}
            <AnimatePresence>
                {showGuide && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="absolute top-1/4 left-0 right-0 text-center z-10 pointer-events-none"
                    >
                        <p className="text-white font-medium bg-black/60 backdrop-blur-sm inline-block px-4 py-2 rounded-full shadow-lg">
                            Placez le code-barres dans le cadre
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Bottom Controls */}
            <div className="relative z-10 p-6 pb-safe bg-gradient-to-t from-black via-black/80 to-transparent">
                <div className="flex justify-evenly items-center max-w-sm mx-auto bg-black/50 backdrop-blur-xl p-2 rounded-3xl border border-white/10">
                    <button className="flex flex-col items-center p-3 text-white/70 hover:text-white transition-colors">
                        <ImageIcon className="w-6 h-6 mb-1" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Galerie</span>
                    </button>

                    <button className="flex flex-col items-center justify-center w-20 h-20 -mt-10 rounded-full bg-primary text-white shadow-[0_4px_20px_rgba(26,122,74,0.4)] border-4 border-black">
                        <Scan className="w-8 h-8" />
                    </button>

                    <button className="flex flex-col items-center p-3 text-white/70 hover:text-white transition-colors">
                        <Keyboard className="w-6 h-6 mb-1" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Saisie</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

