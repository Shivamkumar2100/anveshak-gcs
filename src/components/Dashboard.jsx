import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents, Polygon } from 'react-leaflet';
import L from 'leaflet';
import { Activity, Battery, AlertTriangle, Crosshair, MapPin, MousePointer2 } from 'lucide-react';

const droneIcon = L.divIcon({
  className: 'custom-icon',
  html: `<div style="background-color: #06b6d4; width: 16px; height: 16px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px #06b6d4;"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8]
});

const createTargetIcon = (num) => L.divIcon({
  className: 'custom-target-icon',
  html: `<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 12px; box-shadow: 0 0 8px #ef4444;">${num}</div>`,
  iconSize: [24, 24],
  iconAnchor: [12, 12]
});

function MapClickCatch({ onMapClick, isActive }) {
  useMapEvents({
    click(e) {
      if (isActive) onMapClick([e.latlng.lat, e.latlng.lng]);
    }
  });
  return null;
}

export default function Dashboard() {
  const [sysState, setSysState] = useState('OFF');
  const [zonePoints, setZonePoints] = useState([]);
  const [patrolPath, setPatrolPath] = useState([]); 
  const [targets, setTargets] = useState([]);
  const [dronePos, setDronePos] = useState([23.0330, 72.5466]); 
  const [battery, setBattery] = useState(100);
  const [altitude, setAltitude] = useState(0.0); 
  const [wsConnected, setWsConnected] = useState(false);
  
  const currentPosRef = useRef([23.0330, 72.5466]);
  const wsRef = useRef(null);

  const handleMapClick = (coords) => {
    if (zonePoints.length < 4) setZonePoints([...zonePoints, coords]);
  };

  const generateGridPath = (points) => {
    const lats = points.map(p => p[0]);
    const lngs = points.map(p => p[1]);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);

    const waypoints = [];
    const numSweeps = 6; 
    const latStep = (maxLat - minLat) / numSweeps;

    let movingRight = true;
    for (let i = 0; i <= numSweeps; i++) {
      const currentLat = maxLat - (i * latStep); 
      if (movingRight) {
        waypoints.push([currentLat, minLng]);
        waypoints.push([currentLat, maxLng]);
      } else {
        waypoints.push([currentLat, maxLng]);
        waypoints.push([currentLat, minLng]);
      }
      movingRight = !movingRight;
    }
    return waypoints;
  };

  const startMission = () => {
    if (zonePoints.length === 4) {
      const grid = generateGridPath(zonePoints);
      setPatrolPath(grid);
      setSysState('ACTIVE');
      setDronePos(grid[0]); 
      currentPosRef.current = grid[0];
      setBattery(98); 
    }
  };

  useEffect(() => {
    if (sysState !== 'ACTIVE' || patrolPath.length === 0) return;

    let currentWaypointIdx = 0;
    
    const flightInterval = setInterval(() => {
      setAltitude((Math.random() * (8.5 - 7.5) + 7.5).toFixed(1)); 

      const targetWp = patrolPath[currentWaypointIdx];
      const current = currentPosRef.current;
      
      const step = 0.012; 
      const newLat = current[0] + (targetWp[0] - current[0]) * step;
      const newLng = current[1] + (targetWp[1] - current[1]) * step;
      
      if (Math.abs(targetWp[0] - newLat) < 0.00005 && Math.abs(targetWp[1] - newLng) < 0.00005) {
        currentWaypointIdx++; 
        if(currentWaypointIdx >= patrolPath.length) {
          currentWaypointIdx = 0; 
        }
      }

      currentPosRef.current = [newLat, newLng];
      setDronePos([newLat, newLng]);
    }, 100); 

    const batteryInterval = setInterval(() => setBattery(p => Math.max(0, p - 1)), 60000);

    return () => { clearInterval(flightInterval); clearInterval(batteryInterval); };
  }, [sysState, patrolPath]);

  useEffect(() => {
    if (sysState !== 'ACTIVE') return;
    
    wsRef.current = new WebSocket('ws://localhost:8000/ws');
    wsRef.current.onopen = () => setWsConnected(true);
    
    wsRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        const alertLocation = currentPosRef.current; 
        
        setTargets((prev) => {
          return [{
            id: prev.length + 1,
            type: data.type || "Unknown Target",
            confidence: data.confidence || 0,
            lat: alertLocation[0],
            lng: alertLocation[1],
            timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
          }, ...prev];
        });
      } catch (error) {
        console.error("Failed to parse incoming telemetry data.");
      }
    };
    
    wsRef.current.onclose = () => setWsConnected(false);
    return () => { if (wsRef.current) wsRef.current.close(); };
  }, [sysState]);

  return (
    <div className="flex h-screen w-full bg-slate-900 text-slate-100 font-sans overflow-hidden">
      <div className="w-[30%] border-r border-slate-700 bg-slate-800/50 flex flex-col p-4 shadow-2xl z-10 relative">
        <div className="mb-6 border-b border-slate-700 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Activity className={sysState === 'ACTIVE' ? "text-emerald-400" : "text-slate-500"} size={24} /> 
            Project Anveshak
          </h1>
          <div className="flex items-center gap-2 mt-4">
            <div className={`w-3 h-3 rounded-full ${sysState === 'ACTIVE' ? (wsConnected ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500') : 'bg-red-500'}`}></div>
            <span className={`text-sm font-semibold tracking-wide ${sysState === 'ACTIVE' ? 'text-emerald-400' : 'text-red-400'}`}>
              {sysState === 'ACTIVE' ? (wsConnected ? 'SYSTEM ACTIVE' : 'DRONE FLYING (NO DATA LINK)') : 'SYSTEM OFFLINE'}
            </span>
          </div>
        </div>

        {sysState !== 'ACTIVE' && (
          <div className="flex-1 flex flex-col gap-4">
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
              <h3 className="text-sm font-bold text-slate-300 mb-4 uppercase tracking-wider">Initialize Mission Zone</h3>
              {sysState === 'OFF' && (
                <button onClick={() => setSysState('SELECTING_MAP')} className="w-full bg-slate-700 hover:bg-slate-600 text-white p-3 rounded text-sm flex items-center justify-center gap-2 transition-colors">
                  <MousePointer2 size={16}/> Select Region on Map
                </button>
              )}
              {sysState === 'SELECTING_MAP' && (
                <div className="text-center">
                  <p className="text-emerald-400 font-mono mb-3">Waypoints captured: {zonePoints.length} / 4</p>
                  {zonePoints.length === 4 ? (
                    <button onClick={startMission} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded font-bold shadow-lg transition-colors">Deploy UAV Mission</button>
                  ) : (
                    <button onClick={() => {setZonePoints([]); setSysState('OFF');}} className="w-full bg-slate-700 text-slate-300 py-2 rounded text-sm mt-2 transition-colors">Abort Setup</button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {sysState === 'ACTIVE' && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 shadow-inner">
                <div className="flex items-center gap-2 text-slate-400 text-xs uppercase mb-1 font-semibold">
                  <Battery size={14} className={battery < 20 ? 'text-red-400' : 'text-emerald-400'} /> Battery Level
                </div>
                <div className="text-2xl font-mono">{battery}%</div>
              </div>
              <div className="bg-slate-900 rounded-lg p-3 border border-slate-700 shadow-inner">
                <div className="flex items-center gap-2 text-slate-400 text-xs uppercase mb-1 font-semibold">
                  <Crosshair size={14} className="text-cyan-400" /> Current Altitude
                </div>
                <div className="text-2xl font-mono">{altitude} <span className="text-sm text-slate-500">m</span></div>
              </div>
            </div>

            <div className="flex-1 flex flex-col min-h-0 mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <AlertTriangle size={16} /> Target Event Log
              </h2>
              <div className="flex-1 overflow-y-auto bg-slate-900 rounded-lg border border-slate-700 p-2 shadow-inner">
                {targets.length === 0 ? (
                  <div className="text-slate-600 text-sm p-4 text-center mt-4 italic">Patrolling designated zone...<br/>Awaiting NPU detections.</div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {targets.map((target) => (
                      <div key={target.id} className="bg-slate-800 p-3 rounded border-l-2 border-red-500 text-sm shadow">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-bold text-red-400 flex items-center gap-2">
                            <span className="bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs shadow-sm">{target.id}</span>
                            {target.type}
                          </span>
                          <span className="text-slate-400 text-xs font-mono">{target.timestamp}</span>
                        </div>
                        <div className="text-slate-300 ml-7 text-xs">Model Confidence: <span className="font-mono text-white">{target.confidence}%</span></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button 
              onClick={() => { 
                setTargets([]); 
                setZonePoints([]); 
                setPatrolPath([]); 
                setSysState('OFF'); 
              }}
              className="w-full mt-2 bg-slate-700 hover:bg-red-600 text-white py-3 rounded text-xs uppercase tracking-wider font-bold transition-colors border border-slate-600 shadow"
            >
              🛑 Clear & Reset Mission
            </button>
          </>
        )}
      </div>

      <div className="w-[70%] relative bg-black">
        {sysState === 'ACTIVE' && (
          <div className="absolute top-4 left-4 z-[1000] bg-slate-900/80 backdrop-blur border border-slate-700 rounded-lg p-3 shadow-lg pointer-events-none">
            <div className="text-xs text-slate-400 uppercase tracking-widest mb-1">Live Global Telemetry</div>
            <div className="text-sm font-mono flex items-center gap-2">
              <MapPin size={14} className="text-cyan-400" />
              {dronePos[0].toFixed(6)}, {dronePos[1].toFixed(6)}
            </div>
          </div>
        )}

        <MapContainer center={[23.0330, 72.5466]} zoom={16} style={{ height: '100%', width: '100%' }} zoomControl={false}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" className="dark-map-tiles" />
          <MapClickCatch onMapClick={handleMapClick} isActive={sysState === 'SELECTING_MAP'} />

          {zonePoints.length > 0 && (
            <Polygon positions={zonePoints} color="#22c55e" fillOpacity={0.05} weight={2} />
          )}

          {sysState === 'ACTIVE' && (
            <Polyline positions={patrolPath} color="#06b6d4" weight={1} dashArray="4, 6" opacity={0.4} />
          )}
          
          {sysState === 'SELECTING_MAP' && zonePoints.map((p, i) => (
            <Marker key={i} position={p} icon={createTargetIcon(i+1)} />
          ))}

          {sysState === 'ACTIVE' && (
            <Marker position={dronePos} icon={droneIcon}>
              <Popup className="bg-slate-800 text-white border-none rounded shadow-lg"><strong>Autonomous UAV Patrolling</strong></Popup>
            </Marker>
          )}

          {targets.map((target) => (
            <Marker key={target.id} position={[target.lat, target.lng]} icon={createTargetIcon(target.id)}>
              <Popup>
                <div className="text-sm p-1">
                  <strong className="text-red-600 uppercase tracking-wide">Target ID: #{target.id}</strong><br />
                  <span className="text-slate-600">{target.type}</span><br/>
                  <span className="text-slate-500 text-xs">Confidence: {target.confidence}%</span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}