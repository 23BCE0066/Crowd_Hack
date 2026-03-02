import React from 'react';

interface RiskGaugeProps {
    value: number; // 0 to 100
    label?: string;
}

const RiskGauge: React.FC<RiskGaugeProps> = ({ value, label = "RISK LEVEL" }) => {
    const getColor = () => {
        if (value < 30) return '#00ff88'; // Low
        if (value < 60) return '#f39c12'; // Medium
        return '#e74c3c'; // High
    };

    const color = getColor();
    const rotation = (value / 100) * 360;

    return (
        <div className="flex flex-col items-center justify-center relative w-full h-full min-h-[400px]">
            <div className="mb-6">
                <h3 className="text-sm font-bold text-white/40 tracking-[0.15em] uppercase">Risk Gauge</h3>
            </div>

            <div className="relative group">
                {/* Large Background Glow */}
                <div
                    className="absolute inset-[-40px] rounded-full blur-[80px] opacity-20 transition-all duration-1000 group-hover:opacity-30"
                    style={{ backgroundColor: color }}
                />

                {/* Main Gauge Circle */}
                <div className="w-64 h-64 rounded-full bg-[#121624] border border-white/5 flex items-center justify-center relative shadow-[0_30px_60px_rgba(0,0,0,0.5)] overflow-hidden">
                    {/* Inner Glowing Ring */}
                    <div className="absolute inset-4 rounded-full border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent" />

                    {/* Filled Progress Area (using CSS conic-gradient) */}
                    <div
                        className="absolute inset-4 rounded-full opacity-40 transition-all duration-1000 ease-out"
                        style={{
                            background: `conic-gradient(from 0deg, ${color} 0%, transparent ${value}%, transparent 100%)`,
                            filter: 'blur(10px)',
                            transform: 'rotate(-90deg)'
                        }}
                    />

                    {/* The Needle/Pointer */}
                    <div
                        className="absolute inset-0 z-30 transition-transform duration-1000 ease-out flex items-center justify-center"
                        style={{ transform: `rotate(${rotation}deg)` }}
                    >
                        <div className="w-1 h-32 bg-gradient-to-t from-primary to-transparent rounded-full -translate-y-16" />
                        <div className="w-4 h-4 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)] z-40 border-4 border-black" />
                    </div>

                    {/* Center Content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                        <span className="text-[10px] font-black tracking-[0.25em] text-white/20 mb-3 uppercase">{label}</span>
                        <div className="flex flex-col items-center">
                            <span className="text-6xl font-black tracking-tighter text-white leading-none mb-1">{value}</span>
                            <span className="text-sm font-black tracking-widest text-white/20 uppercase">%</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Risk Label Status */}
            <div className="mt-12 flex flex-col items-center gap-2">
                <div
                    className="px-6 py-2 rounded-2xl border backdrop-blur-xl transition-all duration-500 flex items-center gap-3"
                    style={{
                        backgroundColor: `${color}10`,
                        borderColor: `${color}30`,
                        color: color
                    }}
                >
                    <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                    <span className="font-black tracking-widest text-xs uppercase">
                        {value < 30 ? 'SAFE ZONE' : value < 60 ? 'CAUTION' : 'DANGER ALERT'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default RiskGauge;
