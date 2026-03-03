import { LayoutDashboard, Bell, Activity, Laptop, Settings } from 'lucide-react';

const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', id: 'dashboard' },
    { icon: Bell, label: 'Alerts', id: 'alerts' },
    { icon: Activity, label: 'Sessions', id: 'sessions' },
    { icon: Laptop, label: 'Devices', id: 'devices' },
    { icon: Settings, label: 'Settings', id: 'settings' },
];

const Sidebar = ({ activeTab, onTabChange, isOpen, onClose }: { activeTab: string; onTabChange: (id: string) => void; isOpen: boolean; onClose: () => void }) => {
    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
                    onClick={onClose}
                />
            )}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 h-screen bg-[#0a0c14] border-r border-white/5 flex flex-col py-10 px-6 transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex items-center gap-4 mb-14">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#00d2ff] to-[#3a7bd5] flex items-center justify-center relative shadow-[0_0_20px_rgba(0,210,255,0.3)]">
                        <Activity className="text-white w-6 h-6" />
                        <div className="absolute inset-0 rounded-full border border-white/20 animate-pulse" />
                    </div>
                    <div>
                        <h1 className="font-extrabold text-xl tracking-tight text-white leading-tight">Smart AI</h1>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Crowd Guard Monitoring</p>
                    </div>
                </div>

                <nav className="flex-1 space-y-3">
                    {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onTabChange(item.id);
                                    onClose();
                                }}
                                className={`w-full flex items-center gap-5 px-5 py-4 rounded-2xl transition-all duration-300 group ${isActive
                                    ? 'bg-primary/5 text-primary shadow-[inset_0_0_20px_rgba(0,210,255,0.05)]'
                                    : 'text-white/30 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'opacity-100' : 'opacity-50 group-hover:opacity-100'}`} />
                                <span className={`font-semibold tracking-wide ${isActive ? 'text-white' : ''}`}>{item.label}</span>
                                {isActive && (
                                    <div className="ml-auto w-1 h-4 rounded-full bg-primary shadow-[0_0_12px_rgba(0,210,255,1)]" />
                                )}
                            </button>
                        );
                    })}
                </nav>

                <div className="mt-auto">
                    <div className="p-6 rounded-[2rem] bg-gradient-to-br from-white/[0.03] to-transparent border border-white/5 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12 transition-transform duration-500 group-hover:scale-150" />
                        <p className="text-[10px] font-bold text-white/20 uppercase tracking-widest mb-3">System Protection</p>
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#00ff88]" />
                                <div className="absolute inset-0 w-2.5 h-2.5 rounded-full bg-[#00ff88] animate-ping opacity-75" />
                            </div>
                            <span className="text-sm font-bold text-white/90">Active & Secure</span>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
