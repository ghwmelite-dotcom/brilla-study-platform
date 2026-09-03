import { useState } from 'react';
import { Button, Badge } from '@/components/common';
import {
  RotateCcw,
  Droplets,
  Flame,
  Eye,
  CheckCircle2,
  Apple,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/utils';
import type { SimReportProps } from './types';

type FoodTestsSimulationProps = SimReportProps;

// Food samples with their nutrient content
const foodSamples = [
  {
    id: 'bread',
    name: 'Bread',
    icon: '🍞',
    hasStarch: true,
    hasProtein: false,
    hasFat: false,
    hasReducingSugar: false,
  },
  {
    id: 'egg_white',
    name: 'Egg White',
    icon: '🥚',
    hasStarch: false,
    hasProtein: true,
    hasFat: false,
    hasReducingSugar: false,
  },
  {
    id: 'cooking_oil',
    name: 'Cooking Oil',
    icon: '🫒',
    hasStarch: false,
    hasProtein: false,
    hasFat: true,
    hasReducingSugar: false,
  },
  {
    id: 'potato',
    name: 'Potato',
    icon: '🥔',
    hasStarch: true,
    hasProtein: false,
    hasFat: false,
    hasReducingSugar: false,
  },
  {
    id: 'milk',
    name: 'Milk',
    icon: '🥛',
    hasStarch: false,
    hasProtein: true,
    hasFat: true,
    hasReducingSugar: true,
  },
  {
    id: 'glucose',
    name: 'Glucose Solution',
    icon: '🧪',
    hasStarch: false,
    hasProtein: false,
    hasFat: false,
    hasReducingSugar: true,
  },
  {
    id: 'peanut',
    name: 'Peanut',
    icon: '🥜',
    hasStarch: false,
    hasProtein: true,
    hasFat: true,
    hasReducingSugar: false,
  },
];

type TestType = 'starch' | 'protein' | 'fat' | 'reducing_sugar';

interface TestResult {
  test: TestType;
  color: string;
  result: 'positive' | 'negative';
  description: string;
}

export function FoodTestsSimulation({ onObservation, onAction }: FoodTestsSimulationProps) {
  const [selectedFood, setSelectedFood] = useState(foodSamples[0]);
  const [activeTest, setActiveTest] = useState<TestType | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isHeating, setIsHeating] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [testTubes, setTestTubes] = useState<{
    id: TestType;
    label: string;
    reagent: string;
    color: string;
    tested: boolean;
  }[]>([
    { id: 'starch', label: 'A', reagent: 'Iodine', color: '#8b4513', tested: false },
    { id: 'protein', label: 'B', reagent: 'Biuret', color: '#4fc3f7', tested: false },
    { id: 'fat', label: 'C', reagent: 'Sudan III', color: '#ff5722', tested: false },
    { id: 'reducing_sugar', label: 'D', reagent: "Benedict's", color: '#2196f3', tested: false },
  ]);

  const getTestResult = (test: TestType, food: typeof foodSamples[0]): { positive: boolean; color: string; description: string } => {
    switch (test) {
      case 'starch':
        return food.hasStarch
          ? { positive: true, color: '#1a237e', description: 'Blue-black color indicates starch present' }
          : { positive: false, color: '#8b4513', description: 'Brown color (no change) - starch absent' };
      case 'protein':
        return food.hasProtein
          ? { positive: true, color: '#7b1fa2', description: 'Purple/violet color indicates protein present' }
          : { positive: false, color: '#4fc3f7', description: 'Blue color (no change) - protein absent' };
      case 'fat':
        return food.hasFat
          ? { positive: true, color: '#d32f2f', description: 'Red/orange layer indicates fat present' }
          : { positive: false, color: '#ffeb3b', description: 'No red layer - fat absent' };
      case 'reducing_sugar':
        return food.hasReducingSugar
          ? { positive: true, color: '#ff5722', description: 'Orange/brick red precipitate indicates reducing sugar present' }
          : { positive: false, color: '#2196f3', description: 'Blue color (no change) - reducing sugar absent' };
    }
  };

  const performTest = (test: TestType) => {
    if (isAnimating) return;

    setActiveTest(test);
    setIsAnimating(true);

    // Reagent added to the sample tube.
    onAction?.('pour', 'app_test_tube');

    // For Benedict's test, need heating
    if (test === 'reducing_sugar') {
      setIsHeating(true);
    }

    // Animate test
    setTimeout(() => {
      const result = getTestResult(test, selectedFood);

      // Update test tube color
      setTestTubes(prev => prev.map(tube =>
        tube.id === test ? { ...tube, color: result.color, tested: true } : tube
      ));

      // Add to results
      const newResult: TestResult = {
        test,
        color: result.color,
        result: result.positive ? 'positive' : 'negative',
        description: result.description,
      };

      setTestResults(prev => {
        const filtered = prev.filter(r => r.test !== test);
        return [...filtered, newResult];
      });

      onObservation?.(`${test.replace('_', ' ').toUpperCase()} test on ${selectedFood.name}: ${result.description}`);
      onAction?.('observe', 'app_test_tube');
      onAction?.('record', 'app_test_tube');

      setIsAnimating(false);
      setIsHeating(false);
      setActiveTest(null);
    }, test === 'reducing_sugar' ? 3000 : 1500);
  };

  const resetSimulation = () => {
    setActiveTest(null);
    setTestResults([]);
    setIsAnimating(false);
    setIsHeating(false);
    setTestTubes([
      { id: 'starch', label: 'A', reagent: 'Iodine', color: '#8b4513', tested: false },
      { id: 'protein', label: 'B', reagent: 'Biuret', color: '#4fc3f7', tested: false },
      { id: 'fat', label: 'C', reagent: 'Sudan III', color: '#ff5722', tested: false },
      { id: 'reducing_sugar', label: 'D', reagent: "Benedict's", color: '#2196f3', tested: false },
    ]);
  };

  const changeSample = (food: typeof foodSamples[0]) => {
    setSelectedFood(food);
    resetSimulation();
    onObservation?.(`Selected food sample: ${food.name}`);
    // Sample preparation: a fresh tube is taken and the sample added.
    onAction?.('drag', 'app_test_tube');
    onAction?.('pour', 'app_test_tube');
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-green-50 to-emerald-50">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-white border-b">
        <div className="flex items-center gap-3">
          <Apple className="w-5 h-5 text-green-600" />
          <div>
            <h3 className="font-semibold text-neutral-900 text-sm">Food Tests</h3>
            <p className="text-xs text-neutral-500">Testing {selectedFood.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" size="sm">
            {testResults.length}/4 tests done
          </Badge>
          <Button variant="ghost" size="sm" onClick={resetSimulation}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex p-4 gap-4 min-h-0 overflow-hidden">
        {/* Left - Workbench */}
        <div className="flex-1 flex flex-col items-center justify-center">
          {/* Food Sample Selection */}
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {foodSamples.map((food) => (
              <button
                key={food.id}
                onClick={() => changeSample(food)}
                className={cn(
                  "px-3 py-2 rounded-lg border-2 transition-all text-sm",
                  selectedFood.id === food.id
                    ? "border-green-500 bg-green-100"
                    : "border-neutral-200 bg-white hover:border-green-300"
                )}
              >
                <span className="text-lg mr-1">{food.icon}</span>
                <span className="text-xs">{food.name}</span>
              </button>
            ))}
          </div>

          {/* Test Tubes */}
          <div className="relative">
            {/* Bunsen Burner (for Benedict's test) */}
            <div className={cn(
              "absolute -left-20 bottom-0 transition-opacity",
              activeTest === 'reducing_sugar' ? "opacity-100" : "opacity-50"
            )}>
              <div className="relative">
                {isHeating && (
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                    <svg viewBox="0 0 40 50" className="w-10 h-12 animate-pulse">
                      <defs>
                        <linearGradient id="burnerFlame" x1="0%" y1="100%" x2="0%" y2="0%">
                          <stop offset="0%" stopColor="#ff6b00" />
                          <stop offset="50%" stopColor="#ff9800" />
                          <stop offset="100%" stopColor="#ffeb3b" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M20 0 C25 10 30 20 30 30 C30 45 20 50 20 50 C20 50 10 45 10 30 C10 20 15 10 20 0"
                        fill="url(#burnerFlame)"
                      />
                    </svg>
                  </div>
                )}
                <div className="w-8 h-12 bg-gradient-to-b from-gray-600 to-gray-700 rounded-t-sm" />
                <div className="w-12 h-2 bg-gray-800 rounded -ml-2" />
              </div>
              <p className="text-[10px] text-neutral-500 mt-1 text-center">Burner</p>
            </div>

            {/* Test Tube Rack */}
            <div className="flex flex-col items-center">
              <div className="flex gap-6">
                {testTubes.map((tube) => {
                  const isActive = activeTest === tube.id;
                  const result = testResults.find(r => r.test === tube.id);

                  return (
                    <div key={tube.id} className="flex flex-col items-center">
                      {/* Test tube */}
                      <div
                        className={cn(
                          "relative w-8 h-28 bg-gradient-to-r from-gray-100 via-white to-gray-100 border-2 rounded-b-full transition-all",
                          isActive && isAnimating && "animate-pulse scale-105",
                          tube.tested ? "border-green-400" : "border-gray-300"
                        )}
                      >
                        {/* Sample in tube */}
                        <div className="absolute top-2 left-1 right-1 h-6 bg-neutral-100 rounded-sm opacity-50" />

                        {/* Reagent/Result color */}
                        <div
                          className={cn(
                            "absolute bottom-1 left-1 right-1 rounded-b-full transition-all duration-500",
                            tube.id === 'fat' && tube.tested && result?.result === 'positive'
                              ? "h-1/3" // Fat floats on top
                              : "h-2/3"
                          )}
                          style={{ backgroundColor: tube.color }}
                        />

                        {/* Precipitate for reducing sugar */}
                        {tube.id === 'reducing_sugar' && tube.tested && result?.result === 'positive' && (
                          <div className="absolute bottom-2 left-2 right-2 h-4 bg-gradient-to-b from-orange-400 to-red-500 rounded-full opacity-80" />
                        )}

                        {/* Bubbles when heating */}
                        {tube.id === 'reducing_sugar' && isHeating && (
                          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 space-y-1">
                            <div className="w-1 h-1 bg-white rounded-full animate-bounce" />
                            <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce delay-100" />
                            <div className="w-1 h-1 bg-white rounded-full animate-bounce delay-200" />
                          </div>
                        )}
                      </div>

                      {/* Label */}
                      <div className="mt-2 text-center">
                        <div className="w-6 h-6 rounded-full bg-neutral-800 text-white text-xs flex items-center justify-center font-bold">
                          {tube.label}
                        </div>
                        <p className="text-[10px] text-neutral-500 mt-1">{tube.reagent}</p>
                      </div>

                      {/* Result indicator */}
                      {tube.tested && (
                        <div className="mt-1">
                          {result?.result === 'positive' ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <AlertCircle className="w-4 h-4 text-amber-500" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Rack */}
              <div className="w-64 h-4 bg-gradient-to-b from-amber-600 to-amber-700 rounded-sm mt-2" />
              <div className="w-68 h-2 bg-amber-800 rounded-b" />
            </div>
          </div>

          {/* Reagent Bottles */}
          <div className="mt-8 flex gap-3">
            {[
              { name: 'Iodine', color: '#8b4513', icon: '🟤' },
              { name: 'Biuret', color: '#4fc3f7', icon: '🔵' },
              { name: 'Sudan III', color: '#ff5722', icon: '🔴' },
              { name: "Benedict's", color: '#2196f3', icon: '🔵' },
            ].map((reagent) => (
              <div key={reagent.name} className="flex flex-col items-center">
                <div
                  className="w-6 h-10 rounded-t-sm rounded-b-lg border-2 border-gray-300"
                  style={{ backgroundColor: reagent.color }}
                />
                <p className="text-[9px] text-neutral-500 mt-1 text-center max-w-[50px]">{reagent.name}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Controls & Results */}
        <div className="w-64 flex flex-col gap-3 overflow-y-auto">
          {/* Current Sample */}
          <div className="bg-white rounded-lg p-3 border shadow-sm">
            <h4 className="font-medium text-neutral-900 text-xs mb-2 uppercase tracking-wide">
              Current Sample
            </h4>
            <div className="flex items-center gap-3">
              <span className="text-3xl">{selectedFood.icon}</span>
              <div>
                <p className="font-medium text-neutral-900">{selectedFood.name}</p>
                <p className="text-xs text-neutral-500">Ready for testing</p>
              </div>
            </div>
          </div>

          {/* Test Buttons */}
          <div className="bg-white rounded-lg p-3 border shadow-sm">
            <h4 className="font-medium text-neutral-900 text-xs mb-2 uppercase tracking-wide">
              Perform Tests
            </h4>
            <div className="space-y-2">
              <Button
                variant={testTubes.find(t => t.id === 'starch')?.tested ? 'secondary' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => performTest('starch')}
                disabled={isAnimating}
              >
                <Droplets className="w-3 h-3 mr-2" style={{ color: '#8b4513' }} />
                Iodine Test (Starch)
              </Button>

              <Button
                variant={testTubes.find(t => t.id === 'protein')?.tested ? 'secondary' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => performTest('protein')}
                disabled={isAnimating}
              >
                <Droplets className="w-3 h-3 mr-2" style={{ color: '#4fc3f7' }} />
                Biuret Test (Protein)
              </Button>

              <Button
                variant={testTubes.find(t => t.id === 'fat')?.tested ? 'secondary' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => performTest('fat')}
                disabled={isAnimating}
              >
                <Droplets className="w-3 h-3 mr-2" style={{ color: '#ff5722' }} />
                Sudan III Test (Fat)
              </Button>

              <Button
                variant={testTubes.find(t => t.id === 'reducing_sugar')?.tested ? 'secondary' : 'outline'}
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => performTest('reducing_sugar')}
                disabled={isAnimating}
              >
                <Flame className="w-3 h-3 mr-2" style={{ color: '#2196f3' }} />
                Benedict's Test (Sugar)
                <Badge variant="secondary" size="sm" className="ml-auto text-[9px]">
                  Heat
                </Badge>
              </Button>
            </div>
          </div>

          {/* Results */}
          {testResults.length > 0 && (
            <div className="bg-white rounded-lg p-3 border shadow-sm">
              <h4 className="font-medium text-neutral-900 text-xs mb-2 uppercase tracking-wide flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Results
              </h4>
              <div className="space-y-2">
                {testResults.map((result) => (
                  <div
                    key={result.test}
                    className={cn(
                      "p-2 rounded text-xs",
                      result.result === 'positive' ? "bg-green-50 border border-green-200" : "bg-neutral-50 border"
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-neutral-700 capitalize">
                        {result.test.replace('_', ' ')}
                      </span>
                      <Badge
                        variant={result.result === 'positive' ? 'primary' : 'secondary'}
                        size="sm"
                        className={result.result === 'positive' ? 'bg-green-500' : ''}
                      >
                        {result.result === 'positive' ? '✓ Present' : '✗ Absent'}
                      </Badge>
                    </div>
                    <p className="text-neutral-600">{result.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Table */}
          {testResults.length === 4 && (
            <div className="bg-white rounded-lg p-3 border shadow-sm">
              <h4 className="font-medium text-neutral-900 text-xs mb-2 uppercase tracking-wide">
                Summary for {selectedFood.name}
              </h4>
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-1">Nutrient</th>
                    <th className="text-center py-1">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { name: 'Starch', test: 'starch' },
                    { name: 'Protein', test: 'protein' },
                    { name: 'Fat/Lipid', test: 'fat' },
                    { name: 'Reducing Sugar', test: 'reducing_sugar' },
                  ].map((item) => {
                    const result = testResults.find(r => r.test === item.test);
                    return (
                      <tr key={item.test} className="border-b last:border-0">
                        <td className="py-1">{item.name}</td>
                        <td className="text-center py-1">
                          {result?.result === 'positive' ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-neutral-400">✗</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Reference Card */}
          <div className="bg-white rounded-lg p-3 border shadow-sm">
            <h4 className="font-medium text-neutral-900 text-xs mb-2 uppercase tracking-wide">
              Color Reference
            </h4>
            <div className="space-y-1.5 text-[10px]">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#1a237e' }} />
                <span>Starch +ve: Blue-black</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#7b1fa2' }} />
                <span>Protein +ve: Purple/Violet</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#d32f2f' }} />
                <span>Fat +ve: Red layer</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#ff5722' }} />
                <span>Sugar +ve: Brick red</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
