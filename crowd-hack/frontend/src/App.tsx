import { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import SpeedometerGauge from './components/SpeedometerGauge';
import LiveFeed from './components/LiveFeed';
import DashboardCharts from './components/DashboardCharts';
import { Activity, ShieldCheck, PlayCircle, Settings, Users, AlertTriangle, ChevronDown, Volume2, VolumeX, Eye, LogIn } from 'lucide-react';
import { useUser, SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';
import { supabase } from './lib/supabaseClient';

// Page Imports
import AlertsPage from './pages/AlertsPage';
import SessionsPage from './pages/SessionsPage';
import DevicesPage from './pages/DevicesPage';
import SettingsPage from './pages/SettingsPage';


// Clickable section panel wrapper
const ToggleSection = ({ id, title, icon: Icon, isOpen, onToggle, children, accentColor = '#00d2ff' }: {
  id: string;
  title: string;
  icon: React.ElementType;
  isOpen: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
  accentColor?: string;
}) => {
  return (
    <div className="rounded-[2rem] bg-[#121624]/40 border border-white/5 shadow-2xl backdrop-blur-3xl overflow-hidden transition-all duration-500">
      {/* Clickable header */}
      <button
        onClick={() => onToggle(id)}
        className="w-full flex items-center justify-between px-10 py-6 group hover:bg-white/[0.02] transition-colors"
      >
        <div className="flex items-center gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
            style={{ backgroundColor: `${accentColor}10`, border: `1px solid ${accentColor}25` }}
          >
            <Icon className="w-5 h-5" style={{ color: accentColor }} />
          </div>
          <h3 className="text-sm font-black tracking-[0.15em] uppercase text-white/50 group-hover:text-white/80 transition-colors">{title}</h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-white/20 tracking-widest uppercase">
            {isOpen ? 'Click to hide' : 'Click to show'}
          </span>
          <ChevronDown
            className={`w-5 h-5 text-white/30 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </button>

      {/* Collapsible content */}
      <div
        className={`transition-all duration-700 ease-in-out overflow-hidden ${isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
          }`}
      >
        <div className="px-10 pb-10">
          {children}
        </div>
      </div>
    </div>
  );
};


const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://127.0.0.1:8000';

function App() {
  const { user, isSignedIn } = useUser();
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [riskValue, setRiskValue] = useState(0);
  const [crowdCount, setCrowdCount] = useState(0);
  const [chartData, setChartData] = useState<any[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | 'unsupported'>('prompt');

  // Dashboard States
  const [activeTab, setActiveTab] = useState('dashboard');
  const [maxCapacity, setMaxCapacity] = useState(20);
  const [riskThreshold, setRiskThreshold] = useState(80);
  const [iotThreshold, setIotThreshold] = useState(70);
  const [sirenActive, setSirenActive] = useState(false);
  const [beaconsActive, setBeaconsActive] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Panel toggle states — all open by default
  const [openPanels, setOpenPanels] = useState<Record<string, boolean>>({
    camera: true,
    stats: true,
    meter: true,
    charts: true,
    alerts: true,
    iot: true,
  });

  // Audio alarm
  const [isMuted, setIsMuted] = useState(false);
  const lastAlarmTimeRef = useRef(0);
  const isStartingAlertRef = useRef(false);
  const isStartingSessionRef = useRef(false);
  const activeAlertIdRef = useRef<string | null>(null);

  const togglePanel = (id: string) => {
    setOpenPanels(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Generate high-intensity "Crazy Siren" alarm
  const playSiren = () => {
    if (isMuted) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc1 = audioCtx.createOscillator();
      const osc2 = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(440, audioCtx.currentTime);
      osc2.frequency.setValueAtTime(445, audioCtx.currentTime);

      // Siren wobble
      osc1.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.5);
      osc1.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 1.0);

      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.9);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(audioCtx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 1);
      osc2.stop(audioCtx.currentTime + 1);
    } catch (e) {
      console.warn('Audio alarm failed:', e);
    }
  };

  const playAlarm = () => {
    if (isMuted) return;
    const now = Date.now();
    if (now - lastAlarmTimeRef.current < 5000) return; // 5s cooldown
    lastAlarmTimeRef.current = now;

    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.15, startTime + 0.05);
        gain.gain.linearRampToValueAtTime(0, startTime + duration);
        osc.start(startTime);
        osc.stop(startTime + duration);
      };
      playTone(440, audioCtx.currentTime, 0.2);
      playTone(554, audioCtx.currentTime + 0.25, 0.2);
      playTone(659, audioCtx.currentTime + 0.5, 0.3);
    } catch (e) {
      console.warn('Audio alarm failed:', e);
    }
  };


  // Voice Alert Function
  const speakAlert = (text: string) => {
    if (isMuted) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  // Manual Siren Sound Loop
  useEffect(() => {
    let interval: any;
    if (sirenActive && !isMuted) {
      playSiren();
      interval = setInterval(playSiren, 1200);
    }
    return () => clearInterval(interval);
  }, [sirenActive, isMuted]);

  useEffect(() => {
    if (!navigator.permissions || !navigator.permissions.query) {
      setPermissionStatus('unsupported');
      return;
    }

    navigator.permissions.query({ name: 'camera' as PermissionName }).then((status) => {
      setPermissionStatus(status.state);
      status.onchange = () => {
        setPermissionStatus(status.state);
      };
    });

    const resetBackend = async () => {
      try {
        await fetch(`${API_BASE_URL}/toggle-monitoring`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ active: false }),
        });
      } catch (e) {
        console.warn("Backend reset failed", e);
      }
    };
    resetBackend();
  }, []);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);

  const startMonitoring = async () => {
    if (isStartingSessionRef.current) return;
    isStartingSessionRef.current = true;
    setSessionError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720, frameRate: 30 },
        audio: false
      });
      setStream(mediaStream);
      setIsCameraOn(true);

      // Log Session Start to Supabase
      if (isSignedIn && user) {
        console.log("Saving session for user:", user.id);
        const { data, error } = await supabase
          .from('sessions')
          .insert([
            {
              user_id: user.id,
              user_email: user.primaryEmailAddress?.emailAddress,
              start_time: new Date().toISOString(),
              status: 'active'
            }
          ])
          .select();

        if (error) {
          console.error("Supabase session error:", error);
          setSessionError(error.message);
        } else if (data && data[0]) {
          console.log("Session saved successfully:", data[0].id);
          setCurrentSessionId(data[0].id);
        }
      }

      // Notify Backend
      await fetch(`${API_BASE_URL}/toggle-monitoring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: true }),
      });
    } catch (error) {
      console.error("Error starting monitoring:", error);
    } finally {
      isStartingSessionRef.current = false;
    }
  };

  const stopMonitoring = async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsCameraOn(false);

    // Update Session End in Supabase
    if (currentSessionId) {
      console.log("Closing session:", currentSessionId);
      const { error } = await supabase
        .from('sessions')
        .update({ end_time: new Date().toISOString(), status: 'completed' })
        .eq('id', currentSessionId);

      if (error) console.error("Supabase session update error:", error);
      else console.log("Session closed successfully");
      setCurrentSessionId(null);
    }

    // Update Alert End if active
    if (activeAlertIdRef.current) {
      const alertId = activeAlertIdRef.current;
      console.log("Closing active alert on stop:", alertId);
      await supabase
        .from('alerts')
        .update({ end_time: new Date().toISOString() })
        .eq('id', alertId);

      activeAlertIdRef.current = null;
    }

    try {
      await fetch(`${API_BASE_URL}/toggle-monitoring`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: false }),
      });
    } catch (error) {
      console.error("Error stopping monitoring:", error);
    }
  };

  useEffect(() => {
    if (!isCameraOn) return;

    const interval = setInterval(() => {
      fetch(`${API_BASE_URL}/status`)
        .then(res => res.json())
        .then(data => {
          if (data && data.timestamp) {
            const newCount = data.person_count || 0;
            const newRisk = Math.min(100, Math.round((newCount / maxCapacity) * 100));

            setCrowdCount(newCount);
            setRiskValue(newRisk);

            // Automated Alert Lifecycle
            if (newCount > 0 && newRisk >= riskThreshold) {
              if (!activeAlertIdRef.current && !isStartingAlertRef.current && isSignedIn && user) {
                // START NEW ALERT
                isStartingAlertRef.current = true;
                console.log("[MONITOR] Starting new alert...");
                (async () => {
                  try {
                    const { data, error } = await supabase.from('alerts').insert([{
                      user_id: user.id,
                      type: newRisk >= 90 ? 'critical' : newRisk >= 75 ? 'high' : 'medium',
                      title: newRisk >= 90 ? 'Critical Crowd Risk' : 'High Crowd Density',
                      message: `Alert: Crowd risk reached ${newRisk}% with ${newCount} people.`,
                      risk_value: newRisk,
                      detected_count: newCount,
                      timestamp: new Date().toISOString()
                    }]).select();

                    if (!error && data?.[0]) {
                      activeAlertIdRef.current = data[0].id;
                      console.log("[MONITOR] Alert started:", data[0].id);
                    }
                  } finally {
                    isStartingAlertRef.current = false;
                  }
                })();
              } else if (activeAlertIdRef.current) {
                // UPDATE PEAK COUNT IF NEEDED
                (async () => {
                  const alertId = activeAlertIdRef.current;
                  if (alertId) {
                    await supabase.from('alerts')
                      .update({
                        detected_count: newCount,
                        risk_value: newRisk
                      })
                      .eq('id', alertId);
                  }
                })();
              }

              playAlarm();
              if (newRisk >= 90) {
                speakAlert(`Warning: Risk is ${newRisk} percent. Closing venue doors.`);
                playSiren();
              } else if (newRisk >= 75) {
                speakAlert(`Alert: Risk reached ${newRisk} percent.`);
              }
            } else if (activeAlertIdRef.current) {
              // END ALERT
              const alertToClose = activeAlertIdRef.current;
              activeAlertIdRef.current = null;
              console.log("[MONITOR] Risk dropped. Closing alert:", alertToClose);
              (async () => {
                const endTime = new Date();
                await supabase.from('alerts')
                  .update({ end_time: endTime.toISOString() })
                  .eq('id', alertToClose);
              })();
            }

            const timeStr = new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setChartData(prev => {
              const newData = [...prev, { time: timeStr, count: newCount, risk: newRisk }];
              return newData.slice(-20);
            });
          }
        })
        .catch(err => console.error("Fetch error:", err));
    }, 1000);

    return () => clearInterval(interval);
  }, [isCameraOn, maxCapacity, riskThreshold, iotThreshold, isMuted, sirenActive, beaconsActive, user, isSignedIn]);

  return (
    <div className="flex min-h-screen bg-[#0a0c14] text-white font-sans selection:bg-primary/30">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-10 py-8 flex items-center justify-between border-b border-white/5">
          <div>
            <h2 className="text-3xl font-black tracking-tight mb-1 text-white">Live Crowd Monitoring</h2>
            <p className="text-white/30 font-bold tracking-wide text-sm">Real-time crowd analytics using your device camera.</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Audio Mute Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3 rounded-2xl border transition-all active:scale-95 ${isMuted
                ? 'bg-red-500/10 border-red-500/20 text-red-400'
                : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                }`}
              title={isMuted ? 'Unmute alarms' : 'Mute alarms'}
            >
              {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>

            {/* Settings Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className={`p-3 rounded-2xl border transition-all active:scale-95 ${showSettings
                  ? 'bg-primary/20 border-primary/40 text-primary'
                  : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                  }`}
              >
                <Settings className="w-5 h-5" />
              </button>

              {showSettings && (
                <div className="absolute top-full right-0 mt-4 w-80 bg-[#121624] border border-white/10 rounded-[2rem] p-8 shadow-2xl backdrop-blur-3xl z-50">
                  <h3 className="text-xs font-black text-white/30 tracking-[0.2em] uppercase mb-6">Threshold Settings</h3>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white/60 flex items-center gap-2">
                          <Users className="w-4 h-4 text-primary" /> Venue Capacity
                        </span>
                        <input
                          type="number"
                          value={maxCapacity}
                          onChange={(e) => setMaxCapacity(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-16 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs font-black text-primary text-center focus:outline-none focus:border-primary/40"
                        />
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="1000"
                        value={maxCapacity}
                        onChange={(e) => setMaxCapacity(parseInt(e.target.value))}
                        className="w-full accent-primary bg-white/5 h-1.5 rounded-full appearance-none cursor-pointer"
                      />
                      <div className="flex justify-between text-[8px] font-black text-white/20 uppercase tracking-widest">
                        <span>Room</span>
                        <span>Hall</span>
                        <span>Stadium</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-white/60 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-risk-high" /> Max Risk %
                        </span>
                        <span className="text-sm font-black text-risk-high">{riskThreshold}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={riskThreshold}
                        onChange={(e) => setRiskThreshold(parseInt(e.target.value))}
                        className="w-full accent-risk-high bg-white/5 h-1.5 rounded-full appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {permissionStatus === 'granted' && !isCameraOn && (
              <span className="text-[10px] font-black text-[#00ff88]/40 tracking-widest uppercase flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" />
                Access Authorized
              </span>
            )}
            {permissionStatus === 'denied' && (
              <span className="text-[10px] font-black text-red-500/40 tracking-widest uppercase flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" />
                Access Blocked
              </span>
            )}
            {/* Auth UI */}
            <div className="flex items-center gap-4 pl-4 border-l border-white/10">
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all font-black tracking-tight active:scale-95">
                    <LogIn className="w-4 h-4" />
                    Sign In
                  </button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" appearance={{
                  elements: {
                    userButtonAvatarBox: "w-10 h-10 rounded-xl"
                  }
                }} />
              </SignedIn>
            </div>

            {sessionError && (
              <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20 max-w-[200px] truncate">
                DB Error: {sessionError}
              </span>
            )}

            <button
              onClick={isCameraOn ? stopMonitoring : startMonitoring}
              disabled={!isSignedIn}
              className={`flex items-center gap-3 px-8 py-3 rounded-3xl font-black tracking-tight transition-all active:scale-95 shadow-lg ${!isSignedIn
                ? 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed'
                : isCameraOn
                  ? 'bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20'
                  : 'bg-[#00ff88]/10 border border-[#00ff88]/20 text-[#00ff88] hover:bg-[#00ff88]/20'
                }`}
            >
              <PlayCircle className="w-5 h-5" />
              {isCameraOn ? 'Stop Monitoring' : 'Start Monitoring'}
              {!isSignedIn && <span className="text-[10px] opacity-50">(Login required)</span>}
            </button>
          </div>
        </header>


        {/* ===== CONTENT AREA (Based on Active Tab) ===== */}
        <div className="flex-1 overflow-y-auto px-10 py-8 custom-scrollbar">

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* 1. LIVE CAMERA FEED */}
              <ToggleSection
                id="camera"
                title="Live Camera Feed"
                icon={Eye}
                isOpen={openPanels.camera}
                onToggle={togglePanel}
                accentColor="#00ff88"
              >
                <div className="min-h-[550px]">
                  <LiveFeed stream={stream} />
                </div>
              </ToggleSection>


              {/* 2. BIG STATS: Crowd Count + Risk % */}
              <ToggleSection
                id="stats"
                title="Live Statistics"
                icon={Users}
                isOpen={openPanels.stats}
                onToggle={togglePanel}
                accentColor="#00d2ff"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Crowd Count — BIG */}
                  <div className="rounded-[2rem] bg-gradient-to-br from-[#00d2ff]/5 to-transparent border border-[#00d2ff]/10 p-10 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#00d2ff]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <p className="text-xs font-black tracking-[0.25em] uppercase text-white/30 mb-4">People Detected</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-[120px] font-black tracking-tighter text-white leading-none">{crowdCount}</span>
                      <span className="text-2xl font-bold text-white/20">/ {maxCapacity}</span>
                    </div>
                    <div className="mt-6 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[#00d2ff] animate-pulse" />
                      <span className="text-xs font-bold text-[#00d2ff]/60 tracking-widest uppercase">Live Count</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full max-w-md mt-8 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${Math.min(100, (crowdCount / maxCapacity) * 100)}%`,
                          background: riskValue < 30 ? '#00ff88' : riskValue < 60 ? '#f39c12' : '#e74c3c',
                        }}
                      />
                    </div>
                  </div>

                  {/* Risk Percentage — BIG */}
                  <div className="rounded-[2rem] bg-gradient-to-br from-[#e74c3c]/5 to-transparent border border-[#e74c3c]/10 p-10 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-[#e74c3c]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <p className="text-xs font-black tracking-[0.25em] uppercase text-white/30 mb-4">Risk Level</p>
                    <div className="flex items-baseline gap-1">
                      <span
                        className="text-[120px] font-black tracking-tighter leading-none transition-colors duration-500"
                        style={{ color: riskValue < 30 ? '#00ff88' : riskValue < 60 ? '#f39c12' : '#e74c3c' }}
                      >
                        {riskValue}
                      </span>
                      <span className="text-4xl font-black text-white/20">%</span>
                    </div>
                    <div className="mt-6 flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full animate-pulse"
                        style={{ backgroundColor: riskValue < 30 ? '#00ff88' : riskValue < 60 ? '#f39c12' : '#e74c3c' }}
                      />
                      <span
                        className="text-xs font-bold tracking-widest uppercase"
                        style={{ color: riskValue < 30 ? 'rgba(0,255,136,0.6)' : riskValue < 60 ? 'rgba(243,156,18,0.6)' : 'rgba(231,76,60,0.6)' }}
                      >
                        {riskValue < 30 ? 'LOW RISK' : riskValue < 60 ? 'MEDIUM RISK' : 'HIGH RISK'}
                      </span>
                    </div>
                    {/* Threshold indicator */}
                    <div className="w-full max-w-md mt-8 h-2 bg-white/5 rounded-full overflow-hidden relative">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${riskValue}%`,
                          background: riskValue < 30 ? '#00ff88' : riskValue < 60 ? '#f39c12' : '#e74c3c',
                        }}
                      />
                      {/* Threshold line */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-white/40"
                        style={{ left: `${riskThreshold}%` }}
                      />
                    </div>
                  </div>
                </div>
              </ToggleSection>


              {/* 3. SPEEDOMETER RISK METER */}
              <ToggleSection
                id="meter"
                title="Risk Meter"
                icon={Activity}
                isOpen={openPanels.meter}
                onToggle={togglePanel}
                accentColor="#f39c12"
              >
                <div className="flex justify-center py-6">
                  <div className="w-full max-w-[500px]">
                    <SpeedometerGauge value={riskValue} crowdCount={crowdCount} maxCapacity={maxCapacity} />
                  </div>
                </div>
              </ToggleSection>


              {/* 4. CHARTS */}
              <ToggleSection
                id="charts"
                title="Analytics Charts"
                icon={Activity}
                isOpen={openPanels.charts}
                onToggle={togglePanel}
                accentColor="#00d2ff"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-[2rem] bg-[#0d1020]/60 border border-white/5 p-8 min-h-[300px]">
                    <DashboardCharts
                      title="Crowd Count (Live)"
                      data={chartData}
                      dataKey="count"
                      color="#00d2ff"
                    />
                  </div>
                  <div className="rounded-[2rem] bg-[#0d1020]/60 border border-white/5 p-8 min-h-[300px]">
                    <DashboardCharts
                      title="Risk Percentage (Live)"
                      data={chartData}
                      dataKey="risk"
                      color="#e74c3c"
                    />
                  </div>
                </div>
              </ToggleSection>
            </div>
          )}

          {activeTab === 'alerts' && <AlertsPage />}
          {activeTab === 'sessions' && <SessionsPage />}
          {activeTab === 'devices' && (
            <DevicesPage
              riskValue={riskValue}
              iotThreshold={iotThreshold}
              sirenActive={sirenActive}
              beaconsActive={beaconsActive}
              toggleSiren={() => setSirenActive(!sirenActive)}
              toggleBeacons={() => setBeaconsActive(!beaconsActive)}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsPage
              iotThreshold={iotThreshold}
              setIotThreshold={setIotThreshold}
            />
          )}

        </div>
      </main>
    </div>
  );
}

export default App;
