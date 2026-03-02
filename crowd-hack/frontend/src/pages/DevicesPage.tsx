import React from 'react';
import { Laptop, Lock, Unlock, Volume2, Lightbulb, Power } from 'lucide-react';

interface DeviceProps {
    riskValue: number;
    iotThreshold: number;
    sirenActive: boolean;
    beaconsActive: boolean;
    toggleSiren: () => void;
    toggleBeacons: () => void;
}

const DevicesPage: React.FC<DeviceProps> = ({ riskValue, iotThreshold, sirenActive, beaconsActive, toggleSiren, toggleBeacons }) => {
    const isLocked = riskValue >= iotThreshold;
    const isSirenTriggered = sirenActive || riskValue > iotThreshold + 10;
    const isBeaconsTriggered = beaconsActive || riskValue > iotThreshold - 10;

    const devices = [
        {
            id: 'gate-1',
            name: 'Main Entry Gate',
            type: 'Smart Lock',
            status: isLocked ? 'LOCKED' : 'UNLOCKED',
            icon: isLocked ? Lock : Unlock,
            color: isLocked ? 'text-red-500' : 'text-[#00ff88]',
            autoMode: true
        },
        {
            id: 'siren-1',
            name: 'Emergency Siren',
            type: 'Audio',
            status: isSirenTriggered ? 'ACTIVE' : 'READY',
            icon: Volume2,
            color: isSirenTriggered ? 'text-red-500' : 'text-white/20',
            toggle: toggleSiren,
            isActive: sirenActive
        },
        {
            id: 'lights-1',
            name: 'Warning Beacons',
            type: 'Lighting',
            status: isBeaconsTriggered ? 'ON (FLASHING)' : 'OFF',
            icon: Lightbulb,
            color: isBeaconsTriggered ? 'text-orange-500' : 'text-white/20',
            toggle: toggleBeacons,
            isActive: beaconsActive
        }
    ];

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-black text-white">IoT Ecosystem</h2>
                    <p className="text-white/30 text-xs font-bold tracking-widest uppercase mt-1">Status of connected hardware</p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                    <Power className="w-3 h-3 text-[#00ff88]" />
                    <span className="text-[10px] font-black uppercase text-white/50 tracking-widest">System Online</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {devices.map((device) => (
                    <div key={device.id} className="p-8 rounded-[2.5rem] bg-[#121624]/40 border border-white/5 backdrop-blur-3xl relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-32 h-32 opacity-10 rounded-full blur-3xl -mr-16 -mt-16 transition-colors duration-500 ${isLocked && device.id === 'gate-1' ? 'bg-red-500' : 'bg-primary'}`} />

                        <div className="flex items-center justify-between mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                                <device.icon className={`w-6 h-6 ${device.color}`} />
                            </div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-white/20">{device.type}</div>
                        </div>

                        <h4 className="text-lg font-bold text-white mb-1">{device.name}</h4>
                        <div className="flex items-center gap-2 mb-6">
                            <div className={`w-1.5 h-1.5 rounded-full ${device.status === 'LOCKED' || device.status === 'ACTIVE' || device.status === 'ON (FLASHING)' ? 'bg-red-500' : 'bg-[#00ff88]'}`} />
                            <span className={`text-xs font-black tracking-widest uppercase ${device.color}`}>{device.status}</span>
                        </div>

                        <div className="pt-6 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">
                                {device.autoMode ? 'AI Auto-Mode' : 'Manual Control'}
                            </span>
                            {device.toggle ? (
                                <button
                                    onClick={device.toggle}
                                    className={`w-12 h-6 rounded-full transition-all relative flex items-center px-1 ${device.isActive ? 'bg-primary' : 'bg-white/10'}`}
                                >
                                    <div className={`w-4 h-4 bg-white rounded-full transition-all ${device.isActive ? 'ml-auto' : 'ml-0'}`} />
                                </button>
                            ) : (
                                <div className="w-8 h-4 bg-primary/20 rounded-full relative flex items-center px-1">
                                    <div className="w-2.5 h-2.5 bg-primary rounded-full ml-auto" />
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* AI Response Logic Card */}
            <div className="p-10 rounded-[2.5rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Laptop className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white">Automated Safety Protocol</h3>
                </div>
                <p className="text-sm text-white/50 leading-relaxed max-w-2xl font-medium">
                    The Smart AI system is configured to override manual controls when risk exceeds <span className="text-primary font-bold">{iotThreshold}%</span>.
                    Currently, if the risk value reaches the threshold, <span className="text-white font-bold italic">Venue Gates will automatically lock</span> and sirens will initialize to prevent overcrowding.
                </p>
            </div>
        </div>
    );
};

export default DevicesPage;
