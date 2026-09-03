import { useState } from 'react';
import { Button, Badge } from '@/components/common';
import {
  RotateCcw,
  Flame,
  Droplets,
  Eye,
  CheckCircle2,
  FlaskConical,
  Sparkles
} from 'lucide-react';
import { cn } from '@/utils';
import type { SimReportProps } from './types';

type QualitativeAnalysisSimulationProps = SimReportProps;

// Salt database with properties
const salts = [
  {
    id: 'nacl',
    name: 'Sodium Chloride',
    formula: 'NaCl',
    appearance: 'White crystalline powder',
    flameColor: '#ffd700',
    flameName: 'Golden yellow',
    cation: 'Na⁺',
    anion: 'Cl⁻',
    naohResult: { precipitate: false, color: '', description: 'No precipitate formed' },
    hclResult: { gas: false, description: 'No effervescence' },
    agno3Result: { precipitate: true, color: 'white', description: 'White precipitate (AgCl) - soluble in ammonia' },
    bacl2Result: { precipitate: false, description: 'No precipitate' },
  },
  {
    id: 'cuso4',
    name: 'Copper(II) Sulphate',
    formula: 'CuSO₄',
    appearance: 'Blue crystalline solid',
    flameColor: '#00ff88',
    flameName: 'Green/Blue-green',
    cation: 'Cu²⁺',
    anion: 'SO₄²⁻',
    naohResult: { precipitate: true, color: '#4fc3f7', description: 'Pale blue precipitate (Cu(OH)₂) - insoluble in excess' },
    hclResult: { gas: false, description: 'No effervescence' },
    agno3Result: { precipitate: false, description: 'No white precipitate' },
    bacl2Result: { precipitate: true, color: 'white', description: 'White precipitate (BaSO₄) - insoluble in dilute HCl' },
  },
  {
    id: 'fecl3',
    name: 'Iron(III) Chloride',
    formula: 'FeCl₃',
    appearance: 'Brown/yellow crystalline solid',
    flameColor: '#ffa500',
    flameName: 'Orange-yellow (weak)',
    cation: 'Fe³⁺',
    anion: 'Cl⁻',
    naohResult: { precipitate: true, color: '#8b4513', description: 'Reddish-brown precipitate (Fe(OH)₃) - insoluble in excess' },
    hclResult: { gas: false, description: 'No effervescence' },
    agno3Result: { precipitate: true, color: 'white', description: 'White precipitate (AgCl) - soluble in ammonia' },
    bacl2Result: { precipitate: false, description: 'No precipitate' },
  },
  {
    id: 'caco3',
    name: 'Calcium Carbonate',
    formula: 'CaCO₃',
    appearance: 'White powder',
    flameColor: '#ff6347',
    flameName: 'Brick red',
    cation: 'Ca²⁺',
    anion: 'CO₃²⁻',
    naohResult: { precipitate: false, color: '', description: 'No precipitate (slightly soluble)' },
    hclResult: { gas: true, description: 'Effervescence - CO₂ gas evolved, turns lime water milky' },
    agno3Result: { precipitate: false, description: 'No precipitate' },
    bacl2Result: { precipitate: true, color: 'white', description: 'White precipitate (BaCO₃)' },
  },
  {
    id: 'zncl2',
    name: 'Zinc Chloride',
    formula: 'ZnCl₂',
    appearance: 'White granular solid',
    flameColor: '#98fb98',
    flameName: 'Bluish-green (weak)',
    cation: 'Zn²⁺',
    anion: 'Cl⁻',
    naohResult: { precipitate: true, color: 'white', description: 'White precipitate (Zn(OH)₂) - SOLUBLE in excess NaOH' },
    hclResult: { gas: false, description: 'No effervescence' },
    agno3Result: { precipitate: true, color: 'white', description: 'White precipitate (AgCl) - soluble in ammonia' },
    bacl2Result: { precipitate: false, description: 'No precipitate' },
  },
];

type TestType = 'flame' | 'naoh' | 'hcl' | 'agno3' | 'bacl2';

export function QualitativeAnalysisSimulation({ onObservation, onAction }: QualitativeAnalysisSimulationProps) {
  const [currentSalt, setCurrentSalt] = useState(salts[Math.floor(Math.random() * salts.length)]);
  const [activeTest, setActiveTest] = useState<TestType | null>(null);
  const [completedTests, setCompletedTests] = useState<TestType[]>([]);
  const [testResults, setTestResults] = useState<Record<TestType, string>>({} as Record<TestType, string>);
  const [showAnswer, setShowAnswer] = useState(false);
  const [userGuess, setUserGuess] = useState<{ cation: string; anion: string }>({ cation: '', anion: '' });
  const [isAnimating, setIsAnimating] = useState(false);
  const [showFlame, setShowFlame] = useState(false);

  const performTest = (test: TestType) => {
    setActiveTest(test);
    setIsAnimating(true);

    // Simulate test duration
    setTimeout(() => {
      setIsAnimating(false);
      let result = '';

      switch (test) {
        case 'flame':
          result = `Flame color: ${currentSalt.flameName}`;
          setShowFlame(true);
          setTimeout(() => setShowFlame(false), 2000);
          break;
        case 'naoh':
          result = currentSalt.naohResult.description;
          break;
        case 'hcl':
          result = currentSalt.hclResult.description;
          break;
        case 'agno3':
          result = currentSalt.agno3Result.description;
          break;
        case 'bacl2':
          result = currentSalt.bacl2Result.description;
          break;
      }

      setTestResults(prev => ({ ...prev, [test]: result }));
      if (!completedTests.includes(test)) {
        setCompletedTests(prev => [...prev, test]);
      }
      onObservation?.(`${test.toUpperCase()} test: ${result}`);
      if (test === 'flame') {
        onAction?.('heat', 'app_bunsen_burner');
        onAction?.('observe', 'app_bunsen_burner');
      } else {
        // Reagent added to the sample tube, then the reaction observed.
        onAction?.('pour', 'app_test_tube');
        onAction?.('observe', 'app_test_tube');
      }
      onAction?.('record', 'app_test_tube');
    }, 1500);
  };

  const resetSimulation = () => {
    setCurrentSalt(salts[Math.floor(Math.random() * salts.length)]);
    setActiveTest(null);
    setCompletedTests([]);
    setTestResults({} as Record<TestType, string>);
    setShowAnswer(false);
    setUserGuess({ cation: '', anion: '' });
    setIsAnimating(false);
    setShowFlame(false);
  };

  const checkAnswer = () => {
    const isCorrect = userGuess.cation === currentSalt.cation && userGuess.anion === currentSalt.anion;
    setShowAnswer(true);
    onObservation?.(
      isCorrect
        ? `Correct identification: ${currentSalt.name} (${currentSalt.formula})`
        : `Incorrect. The salt was ${currentSalt.name} (${currentSalt.formula})`
    );
  };

  // Common ions for selection
  const cations = ['Na⁺', 'K⁺', 'Ca²⁺', 'Cu²⁺', 'Fe²⁺', 'Fe³⁺', 'Zn²⁺', 'Pb²⁺', 'NH₄⁺'];
  const anions = ['Cl⁻', 'SO₄²⁻', 'NO₃⁻', 'CO₃²⁻', 'OH⁻', 'S²⁻'];

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <div>
            <h3 className="font-semibold text-neutral-900 text-sm">Qualitative Analysis</h3>
            <p className="text-xs text-neutral-500">Identify the unknown salt</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" size="sm">
            {completedTests.length}/5 tests done
          </Badge>
          <Button variant="ghost" size="sm" onClick={resetSimulation}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex p-4 gap-4 min-h-0 overflow-hidden">
        {/* Left - Workbench */}
        <div className="flex-1 flex flex-col items-center justify-center relative">
          {/* Bunsen Burner with Flame */}
          <div className="absolute left-8 bottom-12">
            <div className="relative">
              {/* Flame */}
              {showFlame && (
                <div
                  className="absolute -top-16 left-1/2 -translate-x-1/2 w-8 animate-pulse"
                  style={{ filter: `drop-shadow(0 0 10px ${currentSalt.flameColor})` }}
                >
                  <svg viewBox="0 0 40 60" className="w-full">
                    <defs>
                      <linearGradient id="flameGrad" x1="0%" y1="100%" x2="0%" y2="0%">
                        <stop offset="0%" stopColor={currentSalt.flameColor} />
                        <stop offset="50%" stopColor={currentSalt.flameColor} stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#fff" stopOpacity="0.6" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M20 0 C25 15 35 25 35 40 C35 55 25 60 20 60 C15 60 5 55 5 40 C5 25 15 15 20 0"
                      fill="url(#flameGrad)"
                    />
                  </svg>
                </div>
              )}
              {/* Burner base */}
              <div className="w-12 h-16 bg-gradient-to-b from-gray-600 to-gray-700 rounded-t-sm" />
              <div className="w-16 h-3 bg-gray-800 rounded -ml-2" />
            </div>
            <p className="text-xs text-neutral-500 mt-2 text-center">Bunsen Burner</p>
          </div>

          {/* Test Tube Rack with Tubes */}
          <div className="flex flex-col items-center">
            {/* Test Tubes */}
            <div className="flex gap-3 mb-2">
              {['NaOH', 'HCl', 'AgNO₃', 'BaCl₂', 'Sample'].map((label) => {
                const testMap: Record<string, TestType> = {
                  'NaOH': 'naoh',
                  'HCl': 'hcl',
                  'AgNO₃': 'agno3',
                  'BaCl₂': 'bacl2',
                };
                const test = testMap[label];
                const isActive = activeTest === test;
                const hasResult = test && completedTests.includes(test);

                // Determine tube content color
                let contentColor = 'transparent';
                if (label === 'Sample') {
                  contentColor = currentSalt.appearance.includes('Blue') ? '#81d4fa' :
                                 currentSalt.appearance.includes('Brown') || currentSalt.appearance.includes('yellow') ? '#ffcc80' :
                                 '#f5f5f5';
                } else if (hasResult) {
                  if (test === 'naoh' && currentSalt.naohResult.precipitate) {
                    contentColor = currentSalt.naohResult.color || '#e0e0e0';
                  } else if (test === 'agno3' && currentSalt.agno3Result.precipitate) {
                    contentColor = '#e0e0e0';
                  } else if (test === 'bacl2' && currentSalt.bacl2Result.precipitate) {
                    contentColor = '#e0e0e0';
                  } else if (test === 'hcl' && currentSalt.hclResult.gas) {
                    contentColor = 'transparent';
                  }
                }

                return (
                  <div key={label} className="flex flex-col items-center">
                    <div
                      className={cn(
                        "relative w-6 h-20 bg-gradient-to-r from-gray-100 via-white to-gray-100 border-2 rounded-b-full transition-all",
                        isActive && isAnimating && "animate-pulse",
                        hasResult ? "border-green-400" : "border-gray-300"
                      )}
                    >
                      {/* Content */}
                      <div
                        className="absolute bottom-1 left-1 right-1 rounded-b-full transition-all"
                        style={{
                          height: label === 'Sample' ? '60%' : hasResult ? '50%' : '30%',
                          backgroundColor: contentColor,
                        }}
                      />
                      {/* Bubbles for gas evolution */}
                      {test === 'hcl' && hasResult && currentSalt.hclResult.gas && (
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                          <div className="w-1 h-1 bg-white rounded-full animate-bounce" />
                          <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-100" />
                          <div className="w-1 h-1 bg-white rounded-full animate-bounce delay-200" />
                        </div>
                      )}
                    </div>
                    <span className="text-[10px] text-neutral-500 mt-1">{label}</span>
                    {hasResult && (
                      <CheckCircle2 className="w-3 h-3 text-green-500 mt-0.5" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Test Tube Rack */}
            <div className="w-48 h-4 bg-gradient-to-b from-amber-700 to-amber-800 rounded-sm" />
            <div className="w-52 h-2 bg-amber-900 rounded-b" />
          </div>

          {/* Sample Display */}
          <div className="mt-8 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg border shadow-sm">
              <FlaskConical className="w-5 h-5 text-amber-600" />
              <div className="text-left">
                <p className="text-xs text-neutral-500">Unknown Salt</p>
                <p className="text-sm font-medium text-neutral-900">{currentSalt.appearance}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right - Controls & Results */}
        <div className="w-64 flex flex-col gap-3 overflow-y-auto">
          {/* Test Buttons */}
          <div className="bg-white rounded-lg p-3 border shadow-sm">
            <h4 className="font-medium text-neutral-900 text-xs mb-2 uppercase tracking-wide">
              Perform Tests
            </h4>
            <div className="space-y-2">
              <Button
                variant={completedTests.includes('flame') ? 'secondary' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => performTest('flame')}
                disabled={isAnimating}
              >
                <Flame className={cn("w-3 h-3 mr-2", showFlame && "text-orange-500")} />
                Flame Test
              </Button>

              <Button
                variant={completedTests.includes('naoh') ? 'secondary' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => performTest('naoh')}
                disabled={isAnimating}
              >
                <Droplets className="w-3 h-3 mr-2" />
                Add NaOH (aq)
              </Button>

              <Button
                variant={completedTests.includes('hcl') ? 'secondary' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => performTest('hcl')}
                disabled={isAnimating}
              >
                <Droplets className="w-3 h-3 mr-2" />
                Add dilute HCl
              </Button>

              <Button
                variant={completedTests.includes('agno3') ? 'secondary' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => performTest('agno3')}
                disabled={isAnimating}
              >
                <Droplets className="w-3 h-3 mr-2" />
                Add AgNO₃ (test Cl⁻)
              </Button>

              <Button
                variant={completedTests.includes('bacl2') ? 'secondary' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => performTest('bacl2')}
                disabled={isAnimating}
              >
                <Droplets className="w-3 h-3 mr-2" />
                Add BaCl₂ (test SO₄²⁻)
              </Button>
            </div>
          </div>

          {/* Results Panel */}
          {completedTests.length > 0 && (
            <div className="bg-white rounded-lg p-3 border shadow-sm">
              <h4 className="font-medium text-neutral-900 text-xs mb-2 uppercase tracking-wide flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Observations
              </h4>
              <div className="space-y-2 text-xs">
                {completedTests.map((test) => (
                  <div key={test} className="p-2 bg-neutral-50 rounded">
                    <span className="font-medium text-neutral-700 uppercase">{test}:</span>
                    <p className="text-neutral-600 mt-0.5">{testResults[test]}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Identification */}
          {completedTests.length >= 3 && !showAnswer && (
            <div className="bg-white rounded-lg p-3 border shadow-sm">
              <h4 className="font-medium text-neutral-900 text-xs mb-2 uppercase tracking-wide">
                Identify the Salt
              </h4>
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-neutral-500">Cation</label>
                  <select
                    className="w-full mt-1 px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    value={userGuess.cation}
                    onChange={(e) => setUserGuess(prev => ({ ...prev, cation: e.target.value }))}
                  >
                    <option value="">Select cation...</option>
                    {cations.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-neutral-500">Anion</label>
                  <select
                    className="w-full mt-1 px-2 py-1.5 text-xs border rounded focus:outline-none focus:ring-1 focus:ring-primary"
                    value={userGuess.anion}
                    onChange={(e) => setUserGuess(prev => ({ ...prev, anion: e.target.value }))}
                  >
                    <option value="">Select anion...</option>
                    {anions.map((a) => (
                      <option key={a} value={a}>{a}</option>
                    ))}
                  </select>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  className="w-full text-xs"
                  onClick={checkAnswer}
                  disabled={!userGuess.cation || !userGuess.anion}
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Check Answer
                </Button>
              </div>
            </div>
          )}

          {/* Answer Reveal */}
          {showAnswer && (
            <div className={cn(
              "rounded-lg p-3 border shadow-sm",
              userGuess.cation === currentSalt.cation && userGuess.anion === currentSalt.anion
                ? "bg-green-50 border-green-200"
                : "bg-red-50 border-red-200"
            )}>
              <h4 className="font-medium text-xs mb-2 uppercase tracking-wide flex items-center gap-1">
                {userGuess.cation === currentSalt.cation && userGuess.anion === currentSalt.anion ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                    <span className="text-green-700">Correct!</span>
                  </>
                ) : (
                  <>
                    <span className="text-red-700">Incorrect</span>
                  </>
                )}
              </h4>
              <div className="text-xs">
                <p className="font-medium text-neutral-900">{currentSalt.name}</p>
                <p className="text-neutral-600">Formula: {currentSalt.formula}</p>
                <p className="text-neutral-600">Cation: {currentSalt.cation}</p>
                <p className="text-neutral-600">Anion: {currentSalt.anion}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-3 text-xs"
                onClick={resetSimulation}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Try Another Salt
              </Button>
            </div>
          )}

          {/* Reference Guide */}
          <div className="bg-white rounded-lg p-3 border shadow-sm">
            <h4 className="font-medium text-neutral-900 text-xs mb-2 uppercase tracking-wide">
              Flame Color Reference
            </h4>
            <div className="space-y-1 text-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ffd700' }} />
                <span>Na⁺ - Golden yellow</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#da70d6' }} />
                <span>K⁺ - Lilac/Purple</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff6347' }} />
                <span>Ca²⁺ - Brick red</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00ff88' }} />
                <span>Cu²⁺ - Blue-green</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
