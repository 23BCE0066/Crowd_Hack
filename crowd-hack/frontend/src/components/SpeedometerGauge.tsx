import React, { useMemo } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface SpeedometerGaugeProps {
    value: number; // 0 to 100
    crowdCount?: number;
    maxCapacity?: number;
}

const SpeedometerGauge: React.FC<SpeedometerGaugeProps> = ({ value, crowdCount = 0, maxCapacity = 20 }) => {
    const clampedValue = Math.min(100, Math.max(0, value));

    // Spring-animated value for the needle
    const springValue = useSpring(clampedValue, {
        stiffness: 80,
        damping: 15,
        mass: 1.2,
    });

    // Map 0-100 to -135deg to +135deg (270° sweep)
    const needleRotation = useTransform(springValue, [0, 100], [-135, 135]);

    React.useEffect(() => {
        springValue.set(clampedValue);
    }, [clampedValue, springValue]);

    const getZoneColor = () => {
        if (clampedValue < 30) return '#00ff88';
        if (clampedValue < 60) return '#f39c12';
        return '#e74c3c';
    };

    const getZoneLabel = () => {
        if (clampedValue < 30) return 'SAFE';
        if (clampedValue < 60) return 'CAUTION';
        return 'DANGER';
    };

    const color = getZoneColor();

    // Generate tick marks for the speedometer (270° arc, from -135° to +135°)
    const ticks = useMemo(() => {
        const result = [];
        const totalTicks = 50;
        const majorEvery = 5;
        for (let i = 0; i <= totalTicks; i++) {
            const angle = -135 + (i / totalTicks) * 270;
            const rad = (angle * Math.PI) / 180;
            const isMajor = i % majorEvery === 0;
            const innerR = isMajor ? 130 : 136;
            const outerR = 144;
            const x1 = 180 + innerR * Math.cos(rad);
            const y1 = 180 + innerR * Math.sin(rad);
            const x2 = 180 + outerR * Math.cos(rad);
            const y2 = 180 + outerR * Math.sin(rad);

            // Color based on position
            const pct = (i / totalTicks) * 100;
            let tickColor = 'rgba(0,255,136,0.5)';
            if (pct >= 60) tickColor = 'rgba(231,76,60,0.6)';
            else if (pct >= 30) tickColor = 'rgba(243,156,18,0.5)';

            result.push(
                <line
                    key={i}
                    x1={x1} y1={y1}
                    x2={x2} y2={y2}
                    stroke={tickColor}
                    strokeWidth={isMajor ? 3 : 1.5}
                    strokeLinecap="round"
                />
            );

            // Number labels for major ticks
            if (isMajor) {
                const labelR = 118;
                const lx = 180 + labelR * Math.cos(rad);
                const ly = 180 + labelR * Math.sin(rad);
                const labelValue = Math.round(pct);
                result.push(
                    <text
                        key={`label-${i}`}
                        x={lx} y={ly}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="rgba(255,255,255,0.35)"
                        fontSize="11"
                        fontWeight="800"
                        fontFamily="Inter, system-ui, sans-serif"
                    >
                        {labelValue}
                    </text>
                );
            }
        }
        return result;
    }, []);

    // Generate the colored arc segments
    const arcSegments = useMemo(() => {
        const segments = [
            { start: 0, end: 30, color: '#00ff88' },
            { start: 30, end: 60, color: '#f39c12' },
            { start: 60, end: 100, color: '#e74c3c' },
        ];

        return segments.map((seg, idx) => {
            const startAngle = -135 + (seg.start / 100) * 270;
            const endAngle = -135 + (seg.end / 100) * 270;
            const startRad = (startAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;
            const r = 150;
            const cx = 180, cy = 180;

            const x1 = cx + r * Math.cos(startRad);
            const y1 = cy + r * Math.sin(startRad);
            const x2 = cx + r * Math.cos(endRad);
            const y2 = cy + r * Math.sin(endRad);

            const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;

            const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;

            return (
                <path
                    key={idx}
                    d={d}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="6"
                    strokeLinecap="round"
                    opacity={0.7}
                    filter="url(#arcGlow)"
                />
            );
        });
    }, []);

    // LED indicators around the bezel
    const leds = useMemo(() => {
        const result = [];
        const totalLeds = 24;
        for (let i = 0; i < totalLeds; i++) {
            const angle = -135 + (i / (totalLeds - 1)) * 270;
            const rad = (angle * Math.PI) / 180;
            const r = 162;
            const cx = 180 + r * Math.cos(rad);
            const cy = 180 + r * Math.sin(rad);
            const pct = (i / (totalLeds - 1)) * 100;
            const isLit = pct <= clampedValue;

            let ledColor = '#00ff88';
            if (pct >= 60) ledColor = '#e74c3c';
            else if (pct >= 30) ledColor = '#f39c12';

            result.push(
                <circle
                    key={`led-${i}`}
                    cx={cx} cy={cy}
                    r={isLit ? 3.5 : 2}
                    fill={isLit ? ledColor : 'rgba(255,255,255,0.06)'}
                    opacity={isLit ? 1 : 0.3}
                    filter={isLit ? 'url(#ledGlow)' : undefined}
                >
                    {isLit && (
                        <animate
                            attributeName="opacity"
                            values="1;0.6;1"
                            dur={`${1.5 + Math.random()}s`}
                            repeatCount="indefinite"
                        />
                    )}
                </circle>
            );
        }
        return result;
    }, [clampedValue]);

    return (
        <div className="flex flex-col items-center justify-center w-full relative">
            {/* Title */}
            <h3 className="text-sm font-bold text-white/40 tracking-[0.15em] uppercase mb-4">Risk Meter</h3>

            {/* Gauge Container */}
            <div className="relative w-full max-w-[420px] aspect-square">
                {/* Background glow */}
                <div
                    className="absolute inset-[-60px] rounded-full blur-[100px] opacity-25 transition-all duration-1000"
                    style={{ backgroundColor: color }}
                />

                {/* Pulsing danger ring */}
                {clampedValue >= 60 && (
                    <div
                        className="absolute inset-[-20px] rounded-full border-2 opacity-20 animate-ping"
                        style={{ borderColor: color }}
                    />
                )}

                <svg viewBox="0 0 360 360" className="w-full h-full drop-shadow-2xl">
                    <defs>
                        <filter id="arcGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <filter id="ledGlow" x="-200%" y="-200%" width="500%" height="500%">
                            <feGaussianBlur stdDeviation="3" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <filter id="needleGlow" x="-100%" y="-100%" width="300%" height="300%">
                            <feGaussianBlur stdDeviation="5" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <radialGradient id="dialBg" cx="50%" cy="50%">
                            <stop offset="0%" stopColor="#1a1e30" />
                            <stop offset="80%" stopColor="#0d1020" />
                            <stop offset="100%" stopColor="#080a14" />
                        </radialGradient>
                        <linearGradient id="bezelGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgba(255,255,255,0.08)" />
                            <stop offset="100%" stopColor="rgba(255,255,255,0.02)" />
                        </linearGradient>
                    </defs>

                    {/* Outer bezel */}
                    <circle cx="180" cy="180" r="175" fill="none" stroke="url(#bezelGrad)" strokeWidth="2" />
                    <circle cx="180" cy="180" r="170" fill="url(#dialBg)" />
                    <circle cx="180" cy="180" r="170" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

                    {/* Inner ring */}
                    <circle cx="180" cy="180" r="100" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                    {/* Arc segments (green/yellow/red zones) */}
                    {arcSegments}

                    {/* Tick marks */}
                    {ticks}

                    {/* LED indicators */}
                    {leds}

                    {/* Center digital display background */}
                    <circle cx="180" cy="180" r="70" fill="rgba(10,12,20,0.9)" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />

                    {/* Center value */}
                    <text
                        x="180" y="165"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="white"
                        fontSize="48"
                        fontWeight="900"
                        fontFamily="Inter, system-ui, sans-serif"
                        letterSpacing="-2"
                    >
                        {clampedValue}
                    </text>
                    <text
                        x="180" y="195"
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="rgba(255,255,255,0.3)"
                        fontSize="12"
                        fontWeight="800"
                        fontFamily="Inter, system-ui, sans-serif"
                        letterSpacing="4"
                    >
                        %
                    </text>

                    {/* Needle */}
                    <motion.g
                        style={{ rotate: needleRotation, originX: '180px', originY: '180px' }}
                        filter="url(#needleGlow)"
                    >
                        {/* Needle body */}
                        <polygon
                            points="180,60 176,180 184,180"
                            fill={color}
                            opacity="0.9"
                        />
                        {/* Needle shadow */}
                        <polygon
                            points="180,70 178,180 182,180"
                            fill="white"
                            opacity="0.3"
                        />
                    </motion.g>

                    {/* Center cap */}
                    <circle cx="180" cy="180" r="12" fill="#1a1e30" stroke={color} strokeWidth="2" />
                    <circle cx="180" cy="180" r="5" fill={color} opacity="0.8">
                        <animate
                            attributeName="opacity"
                            values="0.8;0.4;0.8"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </circle>
                </svg>
            </div>

            {/* Bottom info bar */}
            <div className="flex items-center gap-8 mt-6">
                {/* Zone label */}
                <motion.div
                    className="px-6 py-2.5 rounded-2xl border backdrop-blur-xl flex items-center gap-3"
                    animate={{
                        backgroundColor: `${color}10`,
                        borderColor: `${color}30`,
                    }}
                    transition={{ duration: 0.5 }}
                >
                    <div
                        className="w-2.5 h-2.5 rounded-full animate-pulse"
                        style={{ backgroundColor: color }}
                    />
                    <span
                        className="font-black tracking-widest text-xs uppercase"
                        style={{ color }}
                    >
                        {getZoneLabel()}
                    </span>
                </motion.div>

                {/* Crowd count badge */}
                <div className="px-6 py-2.5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-3">
                    <span className="text-xs font-bold text-white/40">CROWD</span>
                    <span className="text-lg font-black text-white">{crowdCount}</span>
                    <span className="text-xs font-bold text-white/20">/ {maxCapacity}</span>
                </div>
            </div>
        </div>
    );
};

export default SpeedometerGauge;
