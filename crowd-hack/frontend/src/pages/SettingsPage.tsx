import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { supabase } from '../lib/supabaseClient';
import { User, Building, MapPin, LogOut, Save, ShieldCheck, Laptop, AlertTriangle } from 'lucide-react';

interface Profile {
    full_name: string;
    address: string;
    organization: string;
}

interface SettingsProps {
    iotThreshold: number;
    setIotThreshold: (val: number) => void;
}

const SettingsPage: React.FC<SettingsProps> = ({ iotThreshold, setIotThreshold }) => {
    const { user } = useUser();
    const { signOut } = useClerk();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [profile, setProfile] = useState<Profile>({
        full_name: '',
        address: '',
        organization: ''
    });

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user) return;
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (data) {
                setProfile({
                    full_name: data.full_name || '',
                    address: data.address || '',
                    organization: data.organization || ''
                });
            }
            setLoading(false);
        };

        fetchProfile();
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);
        setSaved(false);

        const { error } = await supabase
            .from('profiles')
            .upsert({
                user_id: user.id,
                ...profile,
                updated_at: new Date().toISOString()
            });

        if (!error) {
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        }
        setSaving(false);
    };

    if (loading) return <div className="text-white/20 font-black animate-pulse">Loading Account Settings...</div>;

    return (
        <div className="max-w-4xl w-full mx-auto space-y-6 md:space-y-10">
            <div>
                <h2 className="text-xl md:text-2xl font-black text-white">Advanced Settings</h2>
                <p className="text-white/30 text-[10px] md:text-xs font-bold tracking-widest uppercase mt-1">Manage your identity and preferences</p>
            </div>

            <form onSubmit={handleSave} className="space-y-6 md:space-y-8 w-full">
                <div className="p-5 md:p-10 rounded-3xl md:rounded-[2.5rem] bg-[#121624]/40 border border-white/5 backdrop-blur-3xl space-y-6 md:space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-2 md:mb-4 flex items-center gap-2">
                        <User className="w-3 h-3" /> Account Information
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                        {/* Name */}
                        <div className="space-y-3">
                            <label className="text-xs font-black text-white/40 uppercase tracking-widest pl-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input
                                    type="text"
                                    value={profile.full_name}
                                    onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
                                    placeholder="Enter your full name"
                                />
                            </div>
                        </div>

                        {/* Organization */}
                        <div className="space-y-3">
                            <label className="text-xs font-black text-white/40 uppercase tracking-widest pl-1">Organization / Venue</label>
                            <div className="relative">
                                <Building className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <input
                                    type="text"
                                    value={profile.organization}
                                    onChange={(e) => setProfile({ ...profile, organization: e.target.value })}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
                                    placeholder="e.g. Wembley Stadium"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-white/40 uppercase tracking-widest pl-1">Physical Address</label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-4 w-4 h-4 text-white/20" />
                            <textarea
                                value={profile.address}
                                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-sm font-medium focus:outline-none focus:border-primary/50 focus:bg-white/[0.08] transition-all"
                                placeholder="Enter organization headquarters address..."
                            />
                        </div>
                    </div>

                    <div className="pt-6 flex items-center justify-between">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-3 px-10 py-4 rounded-2xl bg-primary text-background font-black uppercase tracking-widest text-xs hover:scale-105 transition-all active:scale-95 disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : saved ? <><ShieldCheck className="w-4 h-4" /> Changes Saved</> : <><Save className="w-4 h-4" /> Save Profile</>}
                        </button>
                    </div>
                </div>

                {/* IoT Settings Section */}
                <div className="p-5 md:p-10 rounded-3xl md:rounded-[2.5rem] bg-[#121624]/40 border border-white/5 backdrop-blur-3xl space-y-6 md:space-y-8">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary/60 mb-2 md:mb-4 flex items-center gap-2">
                        <Laptop className="w-3 h-3" /> IoT Automation Preferences
                    </h3>

                    <div className="space-y-6 px-2">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <label className="text-xs font-black text-white/80 uppercase tracking-widest flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4 text-risk-high" /> IoT Activation Risk %
                                </label>
                                <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">When risk hits this %, gates lock automatically</p>
                            </div>
                            <span className="text-2xl font-black text-primary">{iotThreshold}%</span>
                        </div>

                        <input
                            type="range"
                            min="10"
                            max="100"
                            step="5"
                            value={iotThreshold}
                            onChange={(e) => setIotThreshold(parseInt(e.target.value))}
                            className="w-full accent-primary bg-white/5 h-2 rounded-full appearance-none cursor-pointer"
                        />

                        <div className="flex justify-between text-[8px] font-black text-white/20 uppercase tracking-[0.3em]">
                            <span>Sensitive</span>
                            <span>Standard</span>
                            <span>Critical Only</span>
                        </div>
                    </div>
                </div>

                {/* Account Security / Logout Section */}
                <div className="p-5 md:p-8 rounded-3xl md:rounded-[2.5rem] bg-red-500/[0.02] border border-red-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-0">
                    <div>
                        <h4 className="text-sm font-black text-white group-hover:text-red-500 transition-colors uppercase tracking-widest">Sign Out</h4>
                        <p className="text-xs text-white/20 font-bold mt-1">End current administrator session</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => signOut()}
                        className="flex items-center gap-3 px-6 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all active:scale-95"
                    >
                        <LogOut className="w-4 h-4" />
                        Log Out Now
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SettingsPage;
