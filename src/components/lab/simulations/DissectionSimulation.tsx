import { useState } from 'react';
import { cn } from '@/utils';

interface DissectionSimulationProps {
  onObservation?: (text: string) => void;
}

interface Organ {
  id: string;
  name: string;
  color: string;
  path: string;
  position: { x: number; y: number };
  description: string;
  function: string;
  identified: boolean;
}

export function DissectionSimulation({ onObservation }: DissectionSimulationProps) {
  const [stage, setStage] = useState<'external' | 'incision' | 'internal' | 'identify'>('external');
  const [selectedOrgan, setSelectedOrgan] = useState<string | null>(null);
  const [identifiedOrgans, setIdentifiedOrgans] = useState<Set<string>>(new Set());
  const [showLabels, setShowLabels] = useState(false);
  const [incisionProgress, setIncisionProgress] = useState(0);

  const organs: Organ[] = [
    {
      id: 'gills',
      name: 'Gills',
      color: '#ef4444',
      path: 'M 120 130 Q 110 150 120 170 Q 130 150 120 130',
      position: { x: 120, y: 150 },
      description: 'Feathery, red structures under gill cover',
      function: 'Gas exchange - absorb O₂, release CO₂',
      identified: false,
    },
    {
      id: 'heart',
      name: 'Heart',
      color: '#dc2626',
      path: 'M 160 170 Q 150 180 160 195 Q 170 180 160 170',
      position: { x: 160, y: 182 },
      description: 'Small, muscular, 2-chambered organ',
      function: 'Pumps deoxygenated blood to gills',
      identified: false,
    },
    {
      id: 'liver',
      name: 'Liver',
      color: '#7c2d12',
      path: 'M 190 165 L 220 160 Q 240 175 230 195 L 200 200 Q 185 185 190 165',
      position: { x: 210, y: 180 },
      description: 'Large, dark red/brown organ',
      function: 'Produces bile, stores glycogen, detoxification',
      identified: false,
    },
    {
      id: 'stomach',
      name: 'Stomach',
      color: '#fbbf24',
      path: 'M 240 175 Q 260 170 275 185 Q 270 205 250 210 Q 235 200 240 175',
      position: { x: 255, y: 190 },
      description: 'J-shaped muscular sac',
      function: 'Chemical and mechanical digestion',
      identified: false,
    },
    {
      id: 'intestine',
      name: 'Intestine',
      color: '#f97316',
      path: 'M 265 210 Q 290 215 310 230 Q 320 250 300 260 Q 280 255 270 240 Q 260 225 265 210',
      position: { x: 285, y: 235 },
      description: 'Long, coiled tube',
      function: 'Nutrient absorption',
      identified: false,
    },
    {
      id: 'swim_bladder',
      name: 'Swim Bladder',
      color: '#e5e5e5',
      path: 'M 220 130 Q 260 125 300 130 Q 310 145 295 155 Q 255 160 220 155 Q 210 145 220 130',
      position: { x: 260, y: 142 },
      description: 'Silvery, gas-filled sac',
      function: 'Buoyancy control',
      identified: false,
    },
    {
      id: 'kidney',
      name: 'Kidney',
      color: '#991b1b',
      path: 'M 200 140 L 330 135 L 335 150 L 205 155 Z',
      position: { x: 265, y: 145 },
      description: 'Dark red, elongated along spine',
      function: 'Osmoregulation, excretion',
      identified: false,
    },
    {
      id: 'gonad',
      name: 'Gonad (Ovary/Testis)',
      color: '#f472b6',
      path: 'M 310 180 Q 340 175 360 190 Q 355 210 330 215 Q 305 205 310 180',
      position: { x: 335, y: 195 },
      description: 'Paired reproductive organs',
      function: 'Produce eggs or sperm',
      identified: false,
    },
  ];

  const externalFeatures = [
    { id: 'dorsal_fin', name: 'Dorsal Fin', position: { x: 250, y: 80 }, description: 'Stability and steering' },
    { id: 'caudal_fin', name: 'Caudal Fin (Tail)', position: { x: 400, y: 180 }, description: 'Propulsion' },
    { id: 'pectoral_fin', name: 'Pectoral Fin', position: { x: 150, y: 210 }, description: 'Steering and braking' },
    { id: 'pelvic_fin', name: 'Pelvic Fin', position: { x: 260, y: 250 }, description: 'Balance' },
    { id: 'anal_fin', name: 'Anal Fin', position: { x: 350, y: 250 }, description: 'Stability' },
    { id: 'lateral_line', name: 'Lateral Line', position: { x: 280, y: 180 }, description: 'Detects water pressure/vibrations' },
    { id: 'operculum', name: 'Operculum (Gill Cover)', position: { x: 130, y: 160 }, description: 'Protects gills' },
    { id: 'eye', name: 'Eye', position: { x: 100, y: 150 }, description: 'Vision, no eyelids' },
  ];

  const makeIncision = () => {
    if (stage !== 'incision') return;

    const interval = setInterval(() => {
      setIncisionProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setStage('internal');
            onObservation?.('Body cavity exposed - internal organs visible');
          }, 500);
          return 100;
        }
        return prev + 5;
      });
    }, 100);
  };

  const identifyOrgan = (organId: string) => {
    if (stage !== 'identify') return;

    const organ = organs.find(o => o.id === organId);
    if (organ && !identifiedOrgans.has(organId)) {
      setIdentifiedOrgans(prev => new Set([...prev, organId]));
      setSelectedOrgan(organId);
      onObservation?.(`Identified: ${organ.name} - ${organ.function}`);
    }
  };

  const currentOrgan = selectedOrgan ? organs.find(o => o.id === selectedOrgan) : null;

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-900 via-rose-900/20 to-slate-900 text-white p-4 overflow-auto">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-xl font-bold bg-gradient-to-r from-rose-400 to-pink-400 bg-clip-text text-transparent">
          Virtual Dissection
        </h2>
        <p className="text-white/60 text-sm">Fish (Tilapia) Anatomy</p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">
        {/* Left Panel - Controls */}
        <div className="lg:w-56 space-y-4 shrink-0">
          {/* Stage Selection */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Dissection Stage</h3>
            <div className="space-y-2">
              {[
                { key: 'external', label: 'External Features', icon: '🐟' },
                { key: 'incision', label: 'Make Incision', icon: '✂️' },
                { key: 'internal', label: 'View Organs', icon: '🔬' },
                { key: 'identify', label: 'Identify Organs', icon: '🏷️' },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => {
                    if (s.key === 'incision' && stage === 'external') {
                      setStage('incision');
                      onObservation?.('Preparing to make ventral incision');
                    } else if (s.key === 'identify' && stage === 'internal') {
                      setStage('identify');
                      onObservation?.('Click on organs to identify them');
                    }
                  }}
                  disabled={
                    (s.key === 'incision' && stage !== 'external') ||
                    (s.key === 'internal' && stage !== 'incision') ||
                    (s.key === 'identify' && stage !== 'internal')
                  }
                  className={cn(
                    'w-full p-2.5 rounded-lg text-left transition-all border flex items-center gap-2',
                    stage === s.key
                      ? 'bg-rose-500/20 border-rose-500/50'
                      : ['external', 'incision', 'internal', 'identify'].indexOf(s.key) < ['external', 'incision', 'internal', 'identify'].indexOf(stage)
                        ? 'bg-emerald-500/20 border-emerald-500/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                  )}
                >
                  <span className="text-lg">{s.icon}</span>
                  <span className="text-sm">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          {stage === 'incision' && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold mb-3 text-white/80">Incision</h3>
              <button
                onClick={makeIncision}
                disabled={incisionProgress > 0}
                className={cn(
                  'w-full py-3 rounded-xl font-medium transition-all',
                  incisionProgress === 0
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700'
                    : 'bg-white/10 text-white/50 cursor-not-allowed'
                )}
              >
                {incisionProgress === 0 ? 'Make Ventral Incision' : `Cutting... ${incisionProgress}%`}
              </button>
              {incisionProgress > 0 && (
                <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-rose-500 to-pink-500"
                    style={{ width: `${incisionProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Toggle Labels */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-sm font-medium">Show Labels</span>
              <div
                onClick={() => setShowLabels(!showLabels)}
                className={cn(
                  'w-12 h-6 rounded-full transition-colors',
                  showLabels ? 'bg-rose-500' : 'bg-white/20'
                )}
              >
                <div
                  className={cn(
                    'w-5 h-5 rounded-full bg-white transform transition-transform mt-0.5',
                    showLabels ? 'translate-x-6' : 'translate-x-0.5'
                  )}
                />
              </div>
            </label>
          </div>

          {/* Progress */}
          {stage === 'identify' && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold mb-3 text-white/80">Progress</h3>
              <div className="text-center">
                <div className="text-3xl font-bold text-rose-400">
                  {identifiedOrgans.size}/{organs.length}
                </div>
                <div className="text-xs text-white/50">organs identified</div>
              </div>
              <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-rose-500 to-pink-500"
                  style={{ width: `${(identifiedOrgans.size / organs.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Center - Fish Visualization */}
        <div className="flex-1 flex items-center justify-center min-h-[350px] bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <svg viewBox="0 0 500 350" className="w-full h-full">
            {/* Background dissection tray */}
            <rect x="20" y="30" width="460" height="290" fill="#1f2937" rx="10" />
            <rect x="30" y="40" width="440" height="270" fill="#374151" rx="8" />

            {/* Fish outline */}
            <g transform="translate(50, 50)">
              {/* Body */}
              <path
                d="M 50 130
                   Q 30 100 50 70
                   Q 100 40 200 50
                   Q 300 45 350 80
                   Q 400 100 380 150
                   Q 400 200 350 220
                   Q 300 255 200 250
                   Q 100 260 50 230
                   Q 30 200 50 170
                   Z"
                fill={stage === 'external' ? '#64748b' : '#475569'}
                stroke="#94a3b8"
                strokeWidth="2"
              />

              {/* Incision line */}
              {stage === 'incision' && incisionProgress > 0 && (
                <line
                  x1="120"
                  y1="200"
                  x2={120 + (incisionProgress / 100) * 230}
                  y2="200"
                  stroke="#ef4444"
                  strokeWidth="3"
                  strokeDasharray="5,3"
                />
              )}

              {/* Body cavity (after incision) */}
              {(stage === 'internal' || stage === 'identify') && (
                <path
                  d="M 130 160
                     Q 200 155 300 160
                     Q 330 180 320 220
                     Q 250 240 170 235
                     Q 140 210 130 160"
                  fill="#fef3c7"
                  stroke="#d97706"
                  strokeWidth="1"
                />
              )}

              {/* Internal organs */}
              {(stage === 'internal' || stage === 'identify') && organs.map(organ => (
                <g key={organ.id}>
                  <path
                    d={organ.path}
                    fill={organ.color}
                    stroke={selectedOrgan === organ.id ? '#fff' : 'rgba(255,255,255,0.3)'}
                    strokeWidth={selectedOrgan === organ.id ? 2 : 1}
                    className={cn(
                      stage === 'identify' && !identifiedOrgans.has(organ.id) && 'cursor-pointer hover:opacity-80',
                      identifiedOrgans.has(organ.id) && 'opacity-100',
                      !identifiedOrgans.has(organ.id) && stage === 'identify' && 'opacity-70'
                    )}
                    onClick={() => identifyOrgan(organ.id)}
                  />
                  {/* Label */}
                  {(showLabels || identifiedOrgans.has(organ.id)) && (
                    <text
                      x={organ.position.x}
                      y={organ.position.y - 15}
                      fill="#fff"
                      fontSize="9"
                      textAnchor="middle"
                      className="pointer-events-none"
                    >
                      {organ.name}
                    </text>
                  )}
                </g>
              ))}

              {/* External features */}
              {stage === 'external' && (
                <>
                  {/* Eye */}
                  <circle cx="80" cy="100" r="15" fill="#1f2937" stroke="#fff" strokeWidth="2" />
                  <circle cx="82" cy="98" r="6" fill="#fff" />
                  <circle cx="83" cy="97" r="3" fill="#000" />

                  {/* Dorsal fin */}
                  <path d="M 180 50 Q 200 20 250 30 Q 300 25 320 50 Q 280 60 220 55 Z" fill="#64748b" stroke="#94a3b8" strokeWidth="1" />

                  {/* Caudal fin (tail) */}
                  <path d="M 370 100 Q 420 80 400 130 Q 420 180 370 200 Q 380 150 370 100" fill="#64748b" stroke="#94a3b8" strokeWidth="1" />

                  {/* Pectoral fin */}
                  <path d="M 100 160 Q 80 180 90 210 Q 110 200 120 180 Q 110 165 100 160" fill="#64748b" stroke="#94a3b8" strokeWidth="1" />

                  {/* Pelvic fin */}
                  <path d="M 200 230 Q 190 260 220 250 Q 230 235 200 230" fill="#64748b" stroke="#94a3b8" strokeWidth="1" />

                  {/* Anal fin */}
                  <path d="M 300 230 Q 290 260 340 250 Q 330 235 300 230" fill="#64748b" stroke="#94a3b8" strokeWidth="1" />

                  {/* Lateral line */}
                  <path d="M 100 150 Q 200 145 350 150" fill="none" stroke="#374151" strokeWidth="2" strokeDasharray="10,5" />

                  {/* Operculum (gill cover) */}
                  <path d="M 100 120 Q 130 100 140 130 Q 130 170 100 180 Q 90 150 100 120" fill="none" stroke="#475569" strokeWidth="3" />

                  {/* Scales pattern */}
                  <pattern id="scales" patternUnits="userSpaceOnUse" width="15" height="15">
                    <path d="M 0 7.5 Q 7.5 0 15 7.5 Q 7.5 15 0 7.5" fill="none" stroke="rgba(148,163,184,0.3)" strokeWidth="0.5" />
                  </pattern>
                  <path
                    d="M 100 100 Q 200 80 300 90 Q 350 130 340 180 Q 300 220 200 220 Q 120 200 100 150 Z"
                    fill="url(#scales)"
                  />

                  {/* Labels for external features */}
                  {showLabels && externalFeatures.map(feature => (
                    <g key={feature.id}>
                      <circle cx={feature.position.x} cy={feature.position.y} r="3" fill="#f472b6" />
                      <text
                        x={feature.position.x}
                        y={feature.position.y - 8}
                        fill="#fff"
                        fontSize="8"
                        textAnchor="middle"
                      >
                        {feature.name}
                      </text>
                    </g>
                  ))}
                </>
              )}
            </g>

            {/* Stage indicator */}
            <text x="250" y="25" fill="#fff" fontSize="11" textAnchor="middle" opacity="0.8">
              {stage === 'external' && 'Observe external features'}
              {stage === 'incision' && 'Make ventral incision from operculum to anus'}
              {stage === 'internal' && 'Body cavity exposed - proceed to identify organs'}
              {stage === 'identify' && 'Click on organs to identify them'}
            </text>
          </svg>
        </div>

        {/* Right Panel - Information */}
        <div className="lg:w-64 space-y-4 shrink-0">
          {/* Selected Organ Info */}
          {currentOrgan && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-lg font-bold text-rose-400 mb-2">{currentOrgan.name}</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-white/50">Appearance:</span>
                  <p className="text-white/80">{currentOrgan.description}</p>
                </div>
                <div>
                  <span className="text-white/50">Function:</span>
                  <p className="text-white/80">{currentOrgan.function}</p>
                </div>
              </div>
            </div>
          )}

          {/* Organ List */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="text-sm font-semibold mb-3 text-white/80">Organs to Identify</h3>
            <div className="space-y-1">
              {organs.map(organ => (
                <div
                  key={organ.id}
                  className={cn(
                    'flex items-center gap-2 p-2 rounded-lg text-sm',
                    identifiedOrgans.has(organ.id)
                      ? 'bg-emerald-500/20'
                      : 'bg-white/5'
                  )}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: organ.color }}
                  />
                  <span className={identifiedOrgans.has(organ.id) ? 'text-emerald-400' : 'text-white/60'}>
                    {organ.name}
                  </span>
                  {identifiedOrgans.has(organ.id) && (
                    <span className="ml-auto text-emerald-400">✓</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* External Features */}
          {stage === 'external' && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="text-sm font-semibold mb-3 text-white/80">External Features</h3>
              <div className="space-y-1 text-xs">
                {externalFeatures.slice(0, 5).map(feature => (
                  <div key={feature.id} className="flex justify-between">
                    <span className="text-white/60">{feature.name}:</span>
                    <span className="text-white/80">{feature.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="bg-rose-500/10 rounded-xl p-4 border border-rose-500/20">
            <h3 className="text-sm font-semibold mb-2 text-rose-400">Dissection Tips</h3>
            <ul className="text-xs text-rose-200/80 space-y-1">
              <li>• Always cut away from your body</li>
              <li>• Use shallow cuts to avoid damaging organs</li>
              <li>• Keep specimens moist</li>
              <li>• Draw biological diagrams to scale</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
