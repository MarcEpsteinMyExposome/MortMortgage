import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import LoanScenarioCard from '../components/LoanScenarioCard';
import {
  LoanScenarioInput,
  LoanCalculationResult,
  calculateLoanScenario,
  findComparisonHighlights,
  PRESETS,
  PresetKey,
} from '../lib/loan-calculator';

interface ScenarioState {
  id: string;
  label: string;
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  termYears: number;
}

const DEFAULT_SCENARIO: Omit<ScenarioState, 'id' | 'label'> = {
  purchasePrice: 400000,
  downPayment: 80000,
  interestRate: 0.0675,
  termYears: 30,
};

function createScenario(label: string, overrides: Partial<ScenarioState> = {}): ScenarioState {
  return {
    id: Math.random().toString(36).substring(2, 9),
    label,
    ...DEFAULT_SCENARIO,
    ...overrides,
  };
}

export default function ComparePage() {
  const [scenarios, setScenarios] = useState<ScenarioState[]>([
    createScenario('Scenario 1'),
    createScenario('Scenario 2'),
  ]);

  // Calculate results for all scenarios
  const results = useMemo(() => {
    return scenarios.map((scenario): LoanCalculationResult | null => {
      if (scenario.purchasePrice <= 0 || scenario.downPayment < 0) {
        return null;
      }
      const input: LoanScenarioInput = {
        label: scenario.label,
        purchasePrice: scenario.purchasePrice,
        downPayment: scenario.downPayment,
        interestRate: scenario.interestRate,
        termYears: scenario.termYears,
      };
      return calculateLoanScenario(input);
    });
  }, [scenarios]);

  // Find comparison highlights
  const highlights = useMemo(() => {
    const validResults = results.filter((r): r is LoanCalculationResult => r !== null);
    if (validResults.length < 2) return null;
    return findComparisonHighlights(validResults);
  }, [results]);

  // Update scenario helper
  const updateScenario = useCallback((id: string, updates: Partial<ScenarioState>) => {
    setScenarios((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  // Add scenario
  const addScenario = useCallback(() => {
    if (scenarios.length < 3) {
      setScenarios((prev) => [...prev, createScenario(`Scenario ${prev.length + 1}`)]);
    }
  }, [scenarios.length]);

  // Remove scenario
  const removeScenario = useCallback((id: string) => {
    if (scenarios.length > 2) {
      setScenarios((prev) => prev.filter((s) => s.id !== id));
    }
  }, [scenarios.length]);

  // Apply preset
  const applyPreset = useCallback((presetKey: PresetKey) => {
    const preset = PRESETS[presetKey];
    const basePrice = scenarios[0]?.purchasePrice || DEFAULT_SCENARIO.purchasePrice;
    const baseDownPayment = scenarios[0]?.downPayment || DEFAULT_SCENARIO.downPayment;
    const baseRate = scenarios[0]?.interestRate || DEFAULT_SCENARIO.interestRate;
    const baseTerm = scenarios[0]?.termYears || DEFAULT_SCENARIO.termYears;

    const newScenarios = preset.scenarios.map((presetScenario, index) => {
      const scenario = createScenario(presetScenario.label);

      // Apply preset values, keeping existing base values for unspecified fields
      scenario.purchasePrice = basePrice;
      scenario.termYears = presetScenario.termYears ?? baseTerm;
      scenario.interestRate = presetScenario.interestRate ?? baseRate;

      // Handle down payment percentage presets
      if ('downPaymentPercent' in presetScenario) {
        scenario.downPayment = basePrice * (presetScenario.downPaymentPercent as number / 100);
      } else {
        scenario.downPayment = baseDownPayment;
      }

      return scenario;
    });

    setScenarios(newScenarios);
  }, [scenarios]);

  return (
    <>
      <Head>
        <title>Loan Comparison Tool | MortMortgage</title>
        <meta name="description" content="Compare different mortgage loan scenarios side-by-side" />
      </Head>

      <main className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-primary-400 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </div>
                  <span className="text-xl font-bold text-gray-900">MortMortgage</span>
                </Link>
                <span className="text-gray-300">|</span>
                <h1 className="text-lg font-semibold text-gray-700">Loan Comparison</h1>
              </div>
              <Link href="/" className="btn btn-secondary btn-sm">
                Back to Home
              </Link>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Compare Loan Scenarios</h2>
            <p className="text-gray-600">
              Compare up to 3 different mortgage scenarios side-by-side to find the best option for your needs.
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Quick Compare:</span>
              {Object.entries(PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key as PresetKey)}
                  className="btn btn-secondary btn-sm"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Scenario Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {scenarios.map((scenario, index) => (
              <LoanScenarioCard
                key={scenario.id}
                index={index}
                input={{
                  label: scenario.label,
                  purchasePrice: scenario.purchasePrice,
                  downPayment: scenario.downPayment,
                  interestRate: scenario.interestRate,
                  termYears: scenario.termYears,
                  onLabelChange: (value) => updateScenario(scenario.id, { label: value }),
                  onPurchasePriceChange: (value) => updateScenario(scenario.id, { purchasePrice: value }),
                  onDownPaymentChange: (value) => updateScenario(scenario.id, { downPayment: value }),
                  onInterestRateChange: (value) => updateScenario(scenario.id, { interestRate: value }),
                  onTermYearsChange: (value) => updateScenario(scenario.id, { termYears: value }),
                  onRemove: () => removeScenario(scenario.id),
                  canRemove: scenarios.length > 2,
                }}
                result={results[index]}
                highlights={highlights}
              />
            ))}

            {/* Add Scenario Button */}
            {scenarios.length < 3 && (
              <button
                onClick={addScenario}
                className="card border-2 border-dashed border-gray-300 hover:border-primary-400 hover:bg-primary-50 transition-all min-h-[400px] flex flex-col items-center justify-center gap-3 text-gray-500 hover:text-primary-600"
              >
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                </svg>
                <span className="font-medium">Add Third Scenario</span>
              </button>
            )}
          </div>

          {/* Comparison Summary */}
          {highlights && results.filter(r => r !== null).length >= 2 && (
            <div className="card p-6 mt-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparison Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <SummaryCard
                  label="Lowest Monthly P&I"
                  value={`$${highlights.lowestMonthlyPI.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  winner={results.find(r => r?.monthlyPI === highlights.lowestMonthlyPI)?.label || ''}
                />
                <SummaryCard
                  label="Lowest Monthly Total"
                  value={`$${highlights.lowestMonthlyTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                  winner={results.find(r => r?.monthlyTotal === highlights.lowestMonthlyTotal)?.label || ''}
                />
                <SummaryCard
                  label="Lowest Total Interest"
                  value={`$${highlights.lowestTotalInterest.toLocaleString(undefined, { minimumFractionDigits: 0 })}`}
                  winner={results.find(r => r?.totalInterest === highlights.lowestTotalInterest)?.label || ''}
                />
                <SummaryCard
                  label="Lowest Total Cost"
                  value={`$${highlights.lowestTotalCost.toLocaleString(undefined, { minimumFractionDigits: 0 })}`}
                  winner={results.find(r => r?.totalPayments === highlights.lowestTotalCost)?.label || ''}
                />
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 card p-6 bg-primary-50 border border-primary-100">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h4 className="font-semibold text-primary-900 mb-1">About These Calculations</h4>
                <p className="text-sm text-primary-700">
                  Property tax is estimated at 1.2% of purchase price annually, and homeowners insurance at 0.35%.
                  PMI estimates are based on typical rates and assume cancellation at 80% LTV.
                  Actual costs may vary based on your location, credit score, and lender.
                  This tool is for educational purposes only.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-gray-500">
                Loan comparison tool by MortMortgage. For educational purposes only.
              </p>
              <div className="flex gap-4">
                <Link href="/" className="text-sm text-primary-600 hover:text-primary-700">
                  Home
                </Link>
                <Link href="/apply/new" className="text-sm text-primary-600 hover:text-primary-700">
                  Apply Now
                </Link>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  winner: string;
}

function SummaryCard({ label, value, winner }: SummaryCardProps) {
  return (
    <div className="bg-success-50 rounded-lg p-4 border border-success-200">
      <p className="text-sm text-success-700 font-medium">{label}</p>
      <p className="text-xl font-bold text-success-900 mt-1">{value}</p>
      <p className="text-xs text-success-600 mt-1">{winner}</p>
    </div>
  );
}
