import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { AlertTriangle, Shield } from 'lucide-react';

interface AlertLog {
    id: string;
    type: string;
    title: string;
    message: string;
    risk_value: number;
    timestamp: string;
}

import { useUser } from '@clerk/clerk-react';

const AlertsPage = () => {
    const { user } = useUser();
    const [alerts, setAlerts] = useState<AlertLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [now, setNow] = useState(new Date());

    const fetchAlerts = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('alerts')
            .select('*')
            .eq('user_id', user.id)
            .order('timestamp', { ascending: false });

        if (error) {
            console.error("Supabase alerts fetch error:", error);
            setErrorMsg(error.message);
        }

        if (data) {
            // Filter out any legacy test alerts
            const realAlerts = (data as AlertLog[]).filter((a: AlertLog) => a.type !== 'test' && !a.title?.toLowerCase().includes('test'));
            setAlerts(realAlerts);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!user) return;
        fetchAlerts();

        const channel = supabase
            .channel('realtime-alerts')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'alerts',
                filter: `user_id=eq.${user.id}`
            }, () => {
                fetchAlerts();
            })
            .subscribe();

        const timer = setInterval(() => setNow(new Date()), 1000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(timer);
        };
    }, [user]);

    const calculateDuration = (start: string, end: string | null) => {
        const startTime = new Date(start).getTime();

        // If no end_time, it's either currently active or a "stuck" legacy alert
        if (!end) {
            const diffMs = now.getTime() - startTime;
            // If it started more than 1 minute ago and is still "active" WITHOUT an end_time, 
            // it's likely a stuck alert from a previous session.
            if (diffMs > 60000) return "Terminated";

            const totalSeconds = Math.floor(diffMs / 1000);
            if (totalSeconds < 1) return 'Just started';
            const mins = Math.floor(totalSeconds / 60);
            const secs = totalSeconds % 60;
            return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
        }

        const endTime = new Date(end).getTime();
        const durationMs = Math.max(0, endTime - startTime);
        const totalSeconds = Math.floor(durationMs / 1000);

        const hours = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        let parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (mins > 0) parts.push(`${mins}m`);
        if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

        return parts.join(' ');
    };

    const clearHistory = async () => {
        if (!user || !window.confirm("Clear all alert history?")) return;
        setLoading(true);
        const { error } = await supabase
            .from('alerts')
            .delete()
            .eq('user_id', user.id);

        if (error) setErrorMsg(error.message);
        else fetchAlerts();
        setLoading(false);
    };

    if (loading) return <div className="flex items-center justify-center h-full text-white/20 font-black animate-pulse">Loading Logs...</div>;

    if (errorMsg) return (
        <div className="p-10 rounded-[2rem] bg-red-500/10 border border-red-500/20 text-red-500">
            <h3 className="font-black uppercase tracking-widest mb-2">Database Error</h3>
            <p className="text-sm opacity-80">{errorMsg}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">Security Alert Logs</h2>
                    <p className="text-white/30 text-[10px] font-black tracking-[0.3em] uppercase mt-1">Automated threat detection history</p>
                </div>
                <div className="flex items-center gap-4">
                    <button
                        onClick={clearHistory}
                        className="px-6 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all text-red-500/60 hover:text-red-500"
                    >
                        Clear History
                    </button>
                    <button
                        onClick={() => { setLoading(true); fetchAlerts(); }}
                        className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all text-white/40 hover:text-white"
                    >
                        Refresh
                    </button>
                    <div className="px-4 py-2 rounded-xl bg-risk-high/10 border border-risk-high/20 text-risk-high text-[10px] font-black uppercase tracking-widest leading-none">
                        {alerts.length} Total Incidents
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {alerts.length === 0 ? (
                    <div className="py-20 flex flex-col items-center opacity-20">
                        <Shield className="w-16 h-16 mb-4" />
                        <p className="font-black text-sm uppercase tracking-widest">No Alerts Recorded</p>
                    </div>
                ) : (
                    alerts.map((alert) => (
                        <div key={alert.id} className="p-8 rounded-[2rem] bg-[#121624]/40 border border-white/5 flex items-center gap-8 group hover:border-white/10 transition-all relative overflow-hidden">
                            {/* Status Indicator Bar */}
                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${alert.type === 'critical' ? 'bg-red-500' :
                                alert.type === 'high' ? 'bg-orange-500' : 'bg-yellow-500'
                                }`} />

                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${alert.type === 'critical' ? 'bg-red-500/10 text-red-500' :
                                alert.type === 'high' ? 'bg-orange-500/10 text-orange-500' : 'bg-yellow-500/10 text-yellow-500'
                                }`}>
                                <AlertTriangle className="w-8 h-8" />
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                    <span className={`text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${alert.type === 'critical' ? 'bg-red-500/20 border-red-500/30 text-red-500' :
                                        alert.type === 'high' ? 'bg-orange-500/20 border-orange-500/30 text-orange-500' : 'bg-yellow-500/20 border-yellow-500/30 text-yellow-500'
                                        }`}>
                                        {alert.type}
                                    </span>
                                    <h4 className="font-black text-white tracking-wide uppercase text-sm">{alert.title}</h4>
                                </div>
                                <p className="text-xs text-white/30 font-bold mb-4">{alert.message}</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-white/20">Peak Risk</p>
                                        <p className="text-xs font-black text-white">{alert.risk_value}%</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-white/20">People Count</p>
                                        <p className="text-xs font-black text-white">{(alert as any).detected_count || 0}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-white/20">Timestamp</p>
                                        <p className="text-xs font-black text-white/60">{new Date(alert.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[8px] font-black uppercase tracking-widest text-white/20">Duration</p>
                                        <p className={`text-xs font-black ${!(alert as any).end_time ? 'text-[#00ff88] animate-pulse' : 'text-white/60'}`}>
                                            {calculateDuration(alert.timestamp, (alert as any).end_time)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default AlertsPage;
