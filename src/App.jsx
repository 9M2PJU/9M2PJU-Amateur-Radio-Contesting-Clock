import React, { useState, useEffect, useMemo } from 'react';
import { Maximize2, Minimize2, Radio, Trophy, Sun, Info, Settings, Heart, MapPin, Globe } from 'lucide-react';
import { format, differenceInSeconds } from 'date-fns';

const App = () => {
    const [time, setTime] = useState(new Date());
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Settings with LocalStorage persistence
    const [callsign, setCallsign] = useState(() => localStorage.getItem('callsign') || '9M2PJU');
    const [gridSquare, setGridSquare] = useState(() => localStorage.getItem('gridSquare') || 'OJ03');
    const [targetDateStr, setTargetDateStr] = useState(() => {
        const saved = localStorage.getItem('targetDate');
        if (saved) return saved;
        const tomorrow = new Date();
        tomorrow.setHours(23, 59, 59, 999);
        return tomorrow.toISOString().slice(0, 16);
    });

    const [timeLeft, setTimeLeft] = useState('00:00:00');
    const [location, setLocation] = useState({ lat: null, lon: null, manual: true });
    const [solarData, setSolarData] = useState({
        sfi: '...',
        sn: '...',
        a: '...',
        k: '...',
        updated: 'Fetching...',
        conditions: '...'
    });

    // Maidenhead Grid Square Calculation
    const calculateGridSquare = (lat, lon) => {
        const l = parseFloat(lon) + 180;
        const b = parseFloat(lat) + 90;

        const field1 = String.fromCharCode(65 + Math.floor(l / 20));
        const field2 = String.fromCharCode(65 + Math.floor(b / 10));

        const square1 = Math.floor((l % 20) / 2);
        const square2 = Math.floor(b % 10);

        const sub1 = String.fromCharCode(97 + Math.floor((l % 2) * 12));
        const sub2 = String.fromCharCode(97 + Math.floor((b % 1) * 24));

        return (field1 + field2 + square1 + square2 + sub1 + sub2).toUpperCase();
    };

    // Geolocation Hook
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const lat = position.coords.latitude;
                    const lon = position.coords.longitude;
                    const calculatedGrid = calculateGridSquare(lat, lon).slice(0, 6);

                    setLocation({
                        lat: lat.toFixed(4),
                        lon: lon.toFixed(4),
                        manual: false
                    });

                    // Auto-update grid square if not manually overridden or first run
                    setGridSquare(calculatedGrid);
                },
                (error) => {
                    console.log("Geolocation error:", error);
                    setLocation(prev => ({ ...prev, manual: true }));
                }
            );
        }
    }, []);

    // Solar Data Fetch Hook
    useEffect(() => {
        const fetchSolarData = async () => {
            try {
                const proxyUrl = "https://api.allorigins.win/get?url=";
                const targetUrl = encodeURIComponent("https://www.hamqsl.com/solarxml.php");
                const response = await fetch(proxyUrl + targetUrl);
                const data = await response.json();

                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(data.contents, "text/xml");

                const sfi = xmlDoc.getElementsByTagName("solarflux")[0]?.textContent || "...";
                const sn = xmlDoc.getElementsByTagName("sunspots")[0]?.textContent || "...";
                const a = xmlDoc.getElementsByTagName("aindex")[0]?.textContent || "...";
                const k = xmlDoc.getElementsByTagName("kindex")[0]?.textContent || "...";
                const updated = xmlDoc.getElementsByTagName("updated")[0]?.textContent || "...";

                const condTag = xmlDoc.getElementsByTagName("calculatedconditions")[0];
                let condText = "GOOD";
                if (condTag) {
                    const firstCond = condTag.getElementsByTagName("condition")[0]?.textContent || "";
                    condText = firstCond.split(":")[1]?.trim() || "GOOD";
                }

                setSolarData({
                    sfi: sfi.trim(),
                    sn: sn.trim(),
                    a: a.trim(),
                    k: k.trim(),
                    updated: updated.trim(),
                    conditions: condText.toUpperCase()
                });
            } catch (error) {
                console.error("Error fetching solar data:", error);
                setSolarData(prev => ({ ...prev, updated: "Offline", conditions: "UNKNOWN" }));
            }
        };

        fetchSolarData();
        const interval = setInterval(fetchSolarData, 1800000);
        return () => clearInterval(interval);
    }, []);

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
        const newGrid = form.gridSquare.value.toUpperCase();
        const newTarget = form.targetDate.value;

        setCallsign(newCallsign);
        setGridSquare(newGrid);
        setTargetDateStr(newTarget);

        localStorage.setItem('callsign', newCallsign);
        localStorage.setItem('gridSquare', newGrid);
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

    const operatorNote = useMemo(() => {
        const hour = time.getUTCHours();
        const kValue = parseInt(solarData.k);
        const sfiValue = parseInt(solarData.sfi);

        if (isNaN(kValue) || isNaN(sfiValue)) return "🔭 Weathering solar data... Stay tuned.";

        if (kValue > 4) {
            return `⚠️ High Geostorm (K=${kValue}). Expect high HF noise. Focus on CW or look for aurora openings on VHF!`;
        } else if (sfiValue > 150) {
            return `🚀 SFI is ${sfiValue}! 10m and 12m should be wide open. DX pileups are calling!`;
        } else if (hour >= 22 || hour <= 1) {
            return "🌓 Gray line in effect. Check 40m/80m for long-haul DX near the sunrise/sunset terminator.";
        } else if (hour >= 10 && hour <= 15) {
            return "☀️ 20m and 15m are likely your best performers during the day. Monitor 10m for sporadic openings.";
        } else {
            return "📡 Conditions are stable. Solar cycle is progressing well. Keep an ear out for weak signals!";
        }
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
                    <div className="clock-label" style={{ marginTop: '1rem' }}>{format(time, 'd-M-yyyy')} UTC</div>
                </div>
            </div>

            {/* LOCAL TIME */}
            <div className="glass-card local-time-section">
                <div className="clock-label">Local Station Time</div>
                <div className="local-time">{format(time, 'HH:mm:ss')}</div>
                <div className="clock-label" style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{format(time, 'EEEE, d MMMM yyyy')}</div>
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
                    Live Solar Propagation
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
                    <div style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(0, 242, 255, 0.1)', borderRadius: '0.5rem', textAlign: 'center' }}>
                        <span style={{ color: 'var(--primary)', fontWeight: 'bold', fontSize: '0.9rem' }}>CONDITIONS: {solarData.conditions}</span>
                    </div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textAlign: 'center' }}>
                        Ref: {solarData.updated} (N0NBH)
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
                        <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--secondary)' }}>{gridSquare}</div>
                    </div>
                    <div className="glass-card" style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)' }}>
                        <div className="clock-label" style={{ fontSize: '0.7rem' }}>LOCATION INFO</div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Globe size={14} color="var(--primary)" />
                            {location.lat ? `${location.lat}°N, ${location.lon}°E` : "Awaiting GPS..."}
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                    <div className="clock-label" style={{ fontSize: '0.8rem' }}>Operator Note:</div>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginTop: '0.5rem', lineHeight: '1.4' }}>
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
                                <label>Grid Square</label>
                                <input type="text" name="gridSquare" defaultValue={gridSquare} placeholder="e.g. OJ03" required />
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
                Made with <Heart size={12} fill="currentColor" color="#ff3e3e" style={{ verticalAlign: 'middle', margin: '0 2px' }} /> by <a href="https://hamradio.my" target="_blank" rel="noopener noreferrer">9M2PJU</a>
            </footer>
        </div>
    );
};

export default App;
