import React from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

interface ChartProps {
    title: string;
    data: any[];
    dataKey: string;
    color: string;
}

const DashboardCharts: React.FC<ChartProps> = ({ title, data, dataKey, color }) => {
    return (
        <div className="flex flex-col h-full group">
            <div className="flex items-center justify-between mb-8">
                <h3 className="text-[11px] font-black text-white/30 tracking-[0.2em] uppercase">{title}</h3>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: color }} />
                </div>
            </div>

            <div className="flex-1 min-h-[180px] relative">
                {/* Subtle Background Glow */}
                <div
                    className="absolute inset-0 blur-[40px] opacity-10 pointer-events-none transition-opacity duration-1000 group-hover:opacity-15"
                    style={{ background: `radial-gradient(circle at center, ${color}, transparent)` }}
                />

                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id={`gradient-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                                <stop offset="50%" stopColor={color} stopOpacity={0.1} />
                                <stop offset="95%" stopColor={color} stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            vertical={false}
                            stroke="rgba(255,255,255,0.03)"
                            strokeDasharray="8 8"
                        />
                        <XAxis
                            dataKey="time"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 700 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'rgba(255,255,255,0.2)', fontSize: 10, fontWeight: 700 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: 'rgba(18, 22, 36, 0.8)',
                                backdropFilter: 'blur(16px)',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                borderRadius: '16px',
                                boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
                            }}
                            itemStyle={{ color: '#fff', fontSize: '11px', fontWeight: 800 }}
                            labelStyle={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', marginBottom: '4px', fontWeight: 700 }}
                            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                        />
                        <Area
                            type="monotone"
                            dataKey={dataKey}
                            stroke={color}
                            strokeWidth={4}
                            fillOpacity={1}
                            fill={`url(#gradient-${dataKey})`}
                            animationDuration={1500}
                            animationEasing="ease-in-out"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default DashboardCharts;
