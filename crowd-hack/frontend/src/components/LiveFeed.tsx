import React, { useRef, useEffect, useState, useCallback } from 'react';
import { ShieldCheck } from 'lucide-react';
import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';
import { ObjectDetection } from '@tensorflow-models/coco-ssd';

// Ensure WebGL backend is used for performance if available
import '@tensorflow/tfjs-backend-webgl';

interface LiveFeedProps {
    stream: MediaStream | null;
    onDetect?: (personCount: number) => void;
}

const LiveFeed: React.FC<LiveFeedProps> = ({ stream, onDetect }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [model, setModel] = useState<ObjectDetection | null>(null);
    const [modelLoading, setModelLoading] = useState(false);
    const requestRef = useRef<number>(undefined);

    useEffect(() => {
        const loadModel = async () => {
            setModelLoading(true);
            try {
                await tf.ready(); // Ensure TF backend is ready
                const loadedModel = await cocoSsd.load(); // Load default mobilenet_v2
                setModel(loadedModel);
                console.log("TFJS Model loaded successfully.");
            } catch (err) {
                console.error("Failed to load TFJS model", err);
            } finally {
                setModelLoading(false);
            }
        };
        loadModel();
    }, []);

    // Handle video stream attachments
    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    // Detection Loop
    const detectFrame = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || !model || !stream) {
            return;
        }

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Check if video is playing and ready
        if (video.readyState === video.HAVE_ENOUGH_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
            // Match canvas size to video size
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            }

            try {
                // Perform detection
                const predictions = await model.detect(video);

                // Filter for 'person' class only
                const personPredictions = predictions.filter(p => p.class === 'person' && p.score > 0.5); // Threshold of 50% confidence

                // Invoke callback with new count
                if (onDetect) {
                    onDetect(personPredictions.length);
                }

                // Clear previous drawings
                if (ctx) {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Optional: Draw bounding boxes for visualization
                    personPredictions.forEach(prediction => {
                        const [x, y, width, height] = prediction.bbox;

                        // Draw box
                        ctx.strokeStyle = '#00ff88'; // Primary green
                        ctx.lineWidth = 2;
                        ctx.strokeRect(x, y, width, height);

                        // Draw confidence label background
                        ctx.fillStyle = 'rgba(0, 255, 136, 0.8)';
                        ctx.fillRect(x, y > 20 ? y - 20 : 0, 80, 20);

                        // Draw confidence text
                        ctx.fillStyle = '#000000';
                        ctx.font = '12px Arial';
                        ctx.fillText(`Person ${Math.round(prediction.score * 100)}%`, x + 5, y > 20 ? y - 5 : 15);
                    });
                }
            } catch (err) {
                console.warn("Detection error in frame", err);
            }
        }

        // Loop
        requestRef.current = requestAnimationFrame(detectFrame);
    }, [model, stream, onDetect]);

    // Start/Stop Detection Loop based on Stream and Model availability
    useEffect(() => {
        if (stream && model) {
            // Small delay to ensure video has started playing before beginning detection loop
            const timeoutId = setTimeout(() => {
                requestRef.current = requestAnimationFrame(detectFrame);
            }, 500);
            return () => {
                clearTimeout(timeoutId);
                if (requestRef.current) cancelAnimationFrame(requestRef.current);
            };
        } else {
            // Stop if stream is killed
            if (requestRef.current) {
                cancelAnimationFrame(requestRef.current);
            }
            // Clear canvas if stopping
            if (canvasRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                if (ctx) ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            }
            // Reset count
            if (onDetect && !stream) {
                onDetect(0);
            }
        }
    }, [stream, model, detectFrame, onDetect]);


    return (
        <div className="relative w-full h-full min-h-[550px] flex flex-col">
            {/* Recording Header */}
            <div className="absolute top-8 left-8 right-8 z-10 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${stream ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`} />
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/60 flex items-center gap-2">
                        {stream ? 'Live Recording' : 'System Standby'}
                        {modelLoading && <span className="text-[#00ff88] animate-pulse normal-case tracking-normal"> (Loading AI Model...)</span>}
                    </span>
                </div>
                <div className="px-3 py-1 rounded bg-black/40 backdrop-blur-md border border-white/10">
                    <span className="text-[10px] font-black tracking-widest text-white/40 uppercase">Zone-0{Math.floor(Math.random() * 9) + 1}</span>
                </div>
            </div>

            {/* Video Container */}
            <div className="flex-1 rounded-[2rem] bg-black/40 border border-white/5 overflow-hidden relative shadow-inner group">
                {!stream && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0a0c14]/80 backdrop-blur-xl z-[5]">
                        <div className="w-24 h-24 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-6">
                            <ShieldCheck className="w-10 h-10 text-white/10" />
                        </div>
                        <p className="text-white/20 font-black tracking-widest uppercase text-[10px] mb-2">Camera Offline</p>
                        <p className="text-white/40 font-bold text-sm tracking-tight text-center max-w-[200px]">
                            Access restricted. Push 'Start Monitoring' to initialize feed.
                        </p>
                    </div>
                )}

                {/* Underlying Video Feed */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ${stream ? 'opacity-100 scale-100 grayscale-0' : 'opacity-0 scale-105 grayscale'}`}
                />

                {/* Overlay Canvas for Bounding Boxes */}
                <canvas
                    ref={canvasRef}
                    className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-700 ${stream ? 'opacity-100' : 'opacity-0'}`}
                />

                {/* Scanning Overlay Effect */}
                {stream && (
                    <div className="absolute inset-0 pointer-events-none z-10">
                        <div className="absolute inset-0 bg-gradient-to-b from-[#00ff88]/5 via-transparent to-[#00ff88]/5" />
                        <div className="absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 border-[#00ff88]/30 rounded-tl-3xl m-4" />
                        <div className="absolute top-0 right-0 w-20 h-20 border-t-2 border-r-2 border-[#00ff88]/30 rounded-tr-3xl m-4" />
                        <div className="absolute bottom-0 left-0 w-20 h-20 border-b-2 border-l-2 border-[#00ff88]/30 rounded-bl-3xl m-4" />
                        <div className="absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 border-[#00ff88]/30 rounded-br-3xl m-4" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default LiveFeed;
