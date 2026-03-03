import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Activity, Clock, Calendar } from 'lucide-react';

interface Session {
    id: string;
    start_time: string;
    end_time: string | null;
    status: string;
    user_email: string;
}

import { useUser } from '@clerk/clerk-react';

const SessionsPage = () => {
    const { user } = useUser();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [now, setNow] = useState(new Date());

    const fetchSessions = async () => {
        if (!user) return;
        const { data, error } = await supabase
            .from('sessions')
            .select('*')
            .eq('user_id', user.id)
            .order('start_time', { ascending: false });

        if (error) {
            console.error("Supabase sessions fetch error:", error);
            setErrorMsg(error.message);
        }

        if (data) {
            setSessions(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!user) return;
        fetchSessions();

        // Real-time subscription
        const channel = supabase
            .channel('realtime-sessions')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'sessions',
                filter: `user_id=eq.${user.id}`
            }, () => {
                fetchSessions();
            })
            .subscribe();

        // Ticker for active durations
        const timer = setInterval(() => setNow(new Date()), 1000);

        return () => {
            supabase.removeChannel(channel);
            clearInterval(timer);
        }
    }, [user]);

    const calculateDuration = (start: string, end: string | null) => {
        const startTime = new Date(start).getTime();

        if (!end) {
            const diffMs = now.getTime() - startTime;
            // If session is active for more than 12 hours without end_time, it's likely stuck
            if (diffMs > 43200000) return "Terminated";

            const totalSeconds = Math.floor(diffMs / 1000);
            const hours = Math.floor(totalSeconds / 3600);
            const mins = Math.floor((totalSeconds % 3600) / 60);
            const secs = totalSeconds % 60;

            let parts = [];
            if (hours > 0) parts.push(`${hours}h`);
            if (mins > 0 || hours > 0) parts.push(`${mins}m`);
            parts.push(`${secs}s`);
            return parts.join(' ');
        }

        const endTime = new Date(end).getTime();
        const durationMs = Math.max(0, endTime - startTime);
        const totalSeconds = Math.floor(durationMs / 1000);

        const hours = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        let parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (mins > 0 || hours > 0) parts.push(`${mins}m`);
        parts.push(`${secs}s`);

        return parts.join(' ');
    };

    const clearHistory = async () => {
        if (!user || !window.confirm("Clear all session history?")) return;
        setLoading(true);
        const { error } = await supabase
            .from('sessions')
            .delete()
            .eq('user_id', user.id);

        if (error) setErrorMsg(error.message);
        else fetchSessions();
        setLoading(false);
    };

    if (loading) return <div className="text-white/20 font-black animate-pulse">Loading Sessions...</div>;

    if (errorMsg) return (
        <div className="p-10 rounded-[2rem] bg-red-500/10 border border-red-500/20 text-red-500">
            <h3 className="font-black uppercase tracking-widest mb-2">Database Error</h3>
            <p className="text-sm opacity-80">{errorMsg}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-black text-white">Monitoring Sessions</h2>
                    <p className="text-white/30 text-xs font-bold tracking-widest uppercase mt-1">Activity log of crowd analysis</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 md:gap-4 w-full md:w-auto">
                    <button
                        onClick={clearHistory}
                        className="px-6 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all text-red-500/60 hover:text-red-500"
                    >
                        Clear History
                    </button>
                    <button
                        onClick={() => { setLoading(true); fetchSessions(); }}
                        className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                    >
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid gap-4">
                {sessions.map((session) => (
                    <div key={session.id} className="p-4 md:p-6 rounded-[1.5rem] bg-white/[0.02] border border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0 hover:bg-white/[0.04] transition-all">
                        <div className="flex items-center gap-6">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${session.status === 'active' ? 'bg-[#00ff88]/10 text-[#00ff88]' : 'bg-white/5 text-white/20'}`}>
                                <Activity className="w-5 h-5" />
                            </div>
                            <div>
                                <h4 className="font-bold text-white/90">{session.user_email}</h4>
                                <div className="flex items-center gap-4 mt-1">
                                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(session.start_time).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-1 text-[10px] font-bold text-white/20 uppercase tracking-widest">
                                        <Clock className="w-3 h-3" />
                                        {new Date(session.start_time).toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="text-left md:text-right w-full md:w-auto mt-2 md:mt-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-1">Duration</p>
                            <p className={`font-black tracking-tight ${session.status === 'active' ? 'text-[#00ff88]' : 'text-white'}`}>
                                {calculateDuration(session.start_time, session.end_time)}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default SessionsPage;
