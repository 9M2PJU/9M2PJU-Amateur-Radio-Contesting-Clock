import React, { useState, useEffect } from 'react';
import { Maximize2, Minimize2, Radio, Trophy, Sun, Info, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const App = () => {
    const [time, setTime] = useState(new Date());
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [timerEnd, setTimerEnd] = useState(null);
    const [timeLeft, setTimeLeft] = useState('00:00:00');

    const [targetDate, setTargetDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1)); // Default to tomorrow

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());

            const now = new Date();
            const diff = targetDate - now;

            if (diff > 0) {
                const h = Math.floor(diff / (1000 * 60 * 60));
                const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                const s = Math.floor((diff % (1000 * 60)) / 1000);
                setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
            } else {
                setTimeLeft('00:00:00');
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [targetDate]);

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

    const getUTCTime = () => {
        return time.toISOString().slice(11, 19);
    };

    const getUTCDate = () => {
        return format(time, 'yyyy-MM-dd') + ' UTC';
    };

    const getLocalTime = () => {
        return format(time, 'HH:mm:ss');
    };

    const getLocalDate = () => {
        return format(time, 'PPPP');
    };

    return (
        <div className="dashboard">
            <button className="fullscreen-btn" onClick={toggleFullscreen}>
                {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
            </button>

            {/* UTC MAIN CLOCK */}
            <div className="glass-card clock-section">
                <div className="clock-display">
                    <div className="clock-label">
                        <Radio size={16} style={{ marginRight: '8px' }} />
                        Universal Time Coordinated
                    </div>
                    <div className="clock-time">{getUTCTime()}</div>
                    <div className="clock-label" style={{ marginTop: '1rem' }}>{getUTCDate()}</div>
                </div>
            </div>

            {/* LOCAL TIME */}
            <div className="glass-card local-time-section">
                <div className="clock-label">Local Time Station</div>
                <div className="local-time">{getLocalTime()}</div>
                <div className="clock-label" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{getLocalDate()}</div>
            </div>

            {/* CONTEST TIMER */}
            <div className="glass-card timer-section">
                <div className="clock-label">
                    <Trophy size={16} style={{ marginRight: '8px' }} />
                    Contest End Timer
                </div>
                <div className="timer-display">{timeLeft}</div>
                <div className="clock-label" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Next Event: CQ WW DX</div>
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
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>145</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-dim)' }}>SN</span>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>82</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-dim)' }}>A-Index</span>
                        <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>12</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-dim)' }}>K-Index</span>
                        <span style={{ color: 'var(--secondary)', fontWeight: 'bold' }}>2</span>
                    </div>
                    <div style={{ marginTop: '1rem', padding: '0.5rem', background: 'rgba(0, 242, 255, 0.1)', borderRadius: '0.5rem', textAlign: 'center' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>CONDITIONS: GOOD</span>
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
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary)' }}>9M2PJU</div>
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
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
                        Keep an eye on the 10m band opening. Solar activity is rising. Good luck in the contest!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default App;
