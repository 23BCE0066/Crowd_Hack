import React, { useRef, useEffect } from 'react';
import { ShieldCheck } from 'lucide-react';

interface LiveFeedProps {
    stream: MediaStream | null;
}

const LiveFeed: React.FC<LiveFeedProps> = ({ stream }) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div className="relative w-full h-full min-h-[550px] flex flex-col">
            {/* Recording Header */}
            <div className="absolute top-8 left-8 right-8 z-10 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${stream ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`} />
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase text-white/60">
                        {stream ? 'Live Recording' : 'System Standby'}
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

                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover transition-all duration-700 ${stream ? 'opacity-100 scale-100 grayscale-0' : 'opacity-0 scale-105 grayscale'}`}
                />

                {/* Scanning Overlay */}
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
