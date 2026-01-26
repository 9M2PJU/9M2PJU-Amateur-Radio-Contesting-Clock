import React, { useState, useEffect, useMemo } from 'react';
import { Maximize2, Minimize2, Radio, Trophy, Sun, Info, Settings, X, Heart } from 'lucide-react';
import { format, differenceInSeconds } from 'date-fns';

const App = () => {
    const [time, setTime] = useState(new Date());
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Settings with LocalStorage persistence
    const [callsign, setCallsign] = useState(() => localStorage.getItem('callsign') || '9M2PJU');
    const [targetDateStr, setTargetDateStr] = useState(() => {
        const saved = localStorage.getItem('targetDate');
        if (saved) return saved;
        // Default to end of current day
        const tomorrow = new Date();
        tomorrow.setHours(23, 59, 59, 999);
        return tomorrow.toISOString().slice(0, 16);
    });

    const [timeLeft, setTimeLeft] = useState('00:00:00');

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setTime(now);

            const target = new Date(targetDateStr);
            const diff = differenceInSeconds(target, now);

            if (diff > 0) {
                const h = Math.floor(diff / 3600);
                const m = Math.floor((diff % 3600) / 60);
                const s = diff % 60;
                setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
            } else {
                setTimeLeft('00:00:00');
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDateStr]);

    const saveSettings = (e) => {
        e.preventDefault();
        const form = e.target;
        const newCallsign = form.callsign.value.toUpperCase();
        const newTarget = form.targetDate.value;

        setCallsign(newCallsign);
        setTargetDateStr(newTarget);

        localStorage.setItem('callsign', newCallsign);
        localStorage.setItem('targetDate', newTarget);
        setShowSettings(false);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    const solarData = {
        sfi: 145,
        sn: 82,
        a: 12,
        k: 2
    };

    const operatorNote = useMemo(() => {
        const hour = time.getUTCHours();
        const { sfi, k } = solarData;

        let note = "";
        if (k > 4) {
            note = "⚠️ Geomagnetic storm detected (K=" + k + "). Expect degraded HF conditions and increased noise. Try lower bands.";
        } else if (sfi > 150) {
            note = "🚀 Solar Flux is high (" + sfi + ")! Excellent 10m and 12m openings are likely. Go hunt those pileups!";
        } else if (hour >= 22 || hour <= 2) {
            note = "🌙 Gray line propagation active. Check 40m and 80m for long-distance openings as the terminator passes.";
        } else if (hour >= 10 && hour <= 14) {
            note = "☀️ Mid-day absorption might be high. 20m and 15m should be your workhorses right now.";
        } else {
            note = "📡 Conditions are stable. Keep an eye on the 10m band opening. Solar activity is rising. Good luck!";
        }
        return note;
    }, [time, solarData]);

    return (
        <div className="dashboard">
            <div style={{ position: 'fixed', top: '1rem', right: '1rem', display: 'flex', gap: '0.5rem', zIndex: 100 }}>
                <button className="settings-btn" style={{ position: 'static' }} onClick={() => setShowSettings(true)}>
                    <Settings size={20} />
                </button>
                <button className="fullscreen-btn" style={{ position: 'static' }} onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                </button>
            </div>

            {/* UTC MAIN CLOCK */}
            <div className="glass-card clock-section">
                <div className="clock-display">
                    <div className="clock-label">
                        <Radio size={16} style={{ marginRight: '8px' }} />
                        Universal Time Coordinated
                    </div>
                    <div className="clock-time">{time.toISOString().slice(11, 19)}</div>
                    <div className="clock-label" style={{ marginTop: '1rem' }}>{format(time, 'yyyy-MM-dd')} UTC</div>
                </div>
            </div>

            {/* LOCAL TIME */}
            <div className="glass-card local-time-section">
                <div className="clock-label">Local Station Time</div>
                <div className="local-time">{format(time, 'HH:mm:ss')}</div>
                <div className="clock-label" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{format(time, 'PPPP')}</div>
            </div>

            {/* CONTEST TIMER */}
            <div className="glass-card timer-section">
                <div className="clock-label">
                    <Trophy size={16} style={{ marginRight: '8px' }} />
                    Contest End Timer
                </div>
                <div className="timer-display">{timeLeft}</div>
                <div className="clock-label" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Target: {format(new Date(targetDateStr), 'HH:mm')} UTC</div>
            </div>

            {/* SOLAR DATA */}
            <div className="glass-card solar-section">
                <div className="clock-label">
                    <Sun size={16} style={{ marginRight: '8px' }} />
                    Solar Propagation
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-dim)' }}>SFI</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{solarData.sfi}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-dim)' }}>SN</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{solarData.sn}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-dim)' }}>A-Index</span>
                        <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>{solarData.a}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-dim)' }}>K-Index</span>
                        <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>{solarData.k}</span>
                    </div>
                    <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(0, 242, 255, 0.1)', borderRadius: '0.5rem', textAlign: 'center' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>CONDITIONS: {solarData.k < 3 ? 'GOOD' : 'FAIR'}</span>
                    </div>
                </div>
            </div>

            {/* INFO & WIDGETS */}
            <div className="glass-card info-section">
                <div className="clock-label">
                    <Info size={16} style={{ marginRight: '8px' }} />
                    Station Information
                </div>
                <div style={{ marginTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)' }}>
                        <div className="clock-label" style={{ fontSize: '0.7rem' }}>CALLSIGN</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>{callsign}</div>
                    </div>
                    <div className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)' }}>
                        <div className="clock-label" style={{ fontSize: '0.7rem' }}>GRID SQUARE</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--secondary)' }}>OJ03</div>
                    </div>
                    <div className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)' }}>
                        <div className="clock-label" style={{ fontSize: '0.7rem' }}>LAT/LON</div>
                        <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>3.13° N, 101.68° E</div>
                    </div>
                </div>
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                    <div className="clock-label" style={{ fontSize: '0.8rem' }}>Operator Note:</div>
                    <p style={{ fontSize: '1rem', color: 'var(--text-main)', marginTop: '0.5rem', lineHeight: '1.4' }}>
                        {operatorNote}
                    </p>
                </div>
            </div>

            {/* SETTINGS MODAL */}
            {showSettings && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">Station Settings</div>
                        <form onSubmit={saveSettings}>
                            <div className="form-group">
                                <label>Station Callsign</label>
                                <input type="text" name="callsign" defaultValue={callsign} placeholder="e.g. 9M2PJU" required />
                            </div>
                            <div className="form-group">
                                <label>Contest End (Local Time)</label>
                                <input type="datetime-local" name="targetDate" defaultValue={targetDateStr} required />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowSettings(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary">Save Changes</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FOOTER */}
            <footer className="footer">
                Made with <Heart size={12} fill="currentColor" color="#ff3e3e" style={{ verticalAlign: 'middle', margin: '0 2px' }} /> by 9M2PJU | <a href="https://hamradio.my" target="_blank" rel="noopener noreferrer">HAMRADIO.MY</a>
            </footer>
        </div>
    );
};

export default App;
