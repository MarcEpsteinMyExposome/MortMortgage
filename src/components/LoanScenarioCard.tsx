import React from 'react';
import {
  LoanCalculationResult,
  ComparisonHighlights,
  formatCurrency,
  formatCurrencyWithCents,
  formatPercent,
  calculateDifference,
} from '../lib/loan-calculator';

interface LoanScenarioInputProps {
  label: string;
  purchasePrice: number;
  downPayment: number;
  interestRate: number;
  termYears: number;
  onLabelChange: (value: string) => void;
  onPurchasePriceChange: (value: number) => void;
  onDownPaymentChange: (value: number) => void;
  onInterestRateChange: (value: number) => void;
  onTermYearsChange: (value: number) => void;
  onRemove?: () => void;
  canRemove: boolean;
}

interface LoanScenarioCardProps {
  index: number;
  input: LoanScenarioInputProps;
  result: LoanCalculationResult | null;
  highlights: ComparisonHighlights | null;
}

const TERM_OPTIONS = [15, 20, 30];

export default function LoanScenarioCard({
  index,
  input,
  result,
  highlights,
}: LoanScenarioCardProps) {
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
    input.onPurchasePriceChange(value);
  };

  const handleDownPaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value.replace(/[^0-9.]/g, '')) || 0;
    input.onDownPaymentChange(value);
  };

  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    input.onInterestRateChange(value / 100); // Convert from display % to decimal
  };

  const isLowestMonthlyPI = result && highlights && result.monthlyPI === highlights.lowestMonthlyPI;
  const isLowestMonthlyTotal = result && highlights && result.monthlyTotal === highlights.lowestMonthlyTotal;
  const isLowestTotalCost = result && highlights && result.totalPayments === highlights.lowestTotalCost;
  const isLowestTotalInterest = result && highlights && result.totalInterest === highlights.lowestTotalInterest;

  return (
    <div className="card p-6 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-semibold text-sm">
            {index + 1}
          </span>
          <input
            type="text"
            value={input.label}
            onChange={(e) => input.onLabelChange(e.target.value)}
            className="text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0 p-0"
            placeholder="Scenario Name"
          />
        </div>
        {input.canRemove && input.onRemove && (
          <button
            onClick={input.onRemove}
            className="text-gray-400 hover:text-danger-500 transition-colors"
            title="Remove scenario"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Input Fields */}
      <div className="space-y-4 mb-6">
        {/* Purchase Price */}
        <div>
          <label className="label">Purchase Price</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="text"
              value={input.purchasePrice > 0 ? input.purchasePrice.toLocaleString() : ''}
              onChange={handlePriceChange}
              className="input pl-7 text-right"
              placeholder="400,000"
            />
          </div>
        </div>

        {/* Down Payment */}
        <div>
          <label className="label">Down Payment</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="text"
              value={input.downPayment > 0 ? input.downPayment.toLocaleString() : ''}
              onChange={handleDownPaymentChange}
              className="input pl-7 text-right"
              placeholder="80,000"
            />
          </div>
          {input.purchasePrice > 0 && input.downPayment > 0 && (
            <p className="text-xs text-gray-500 mt-1 text-right">
              {formatPercent((input.downPayment / input.purchasePrice) * 100, 1)} of purchase price
            </p>
          )}
        </div>

        {/* Interest Rate */}
        <div>
          <label className="label">Interest Rate</label>
          <div className="relative">
            <input
              type="number"
              step="0.125"
              min="0"
              max="20"
              value={input.interestRate > 0 ? (input.interestRate * 100).toFixed(3) : ''}
              onChange={handleRateChange}
              className="input pr-8 text-right"
              placeholder="6.750"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">%</span>
          </div>
        </div>

        {/* Loan Term */}
        <div>
          <label className="label">Loan Term</label>
          <div className="flex gap-2">
            {TERM_OPTIONS.map((term) => (
              <button
                key={term}
                onClick={() => input.onTermYearsChange(term)}
                className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  input.termYears === term
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {term} yr
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200 my-4" />

      {/* Results */}
      {result && highlights ? (
        <div className="space-y-3 flex-1">
          <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Results</h4>

          {/* Loan Amount */}
          <ResultRow
            label="Loan Amount"
            value={formatCurrency(result.loanAmount)}
          />

          {/* LTV Ratio */}
          <ResultRow
            label="LTV Ratio"
            value={formatPercent(result.ltvRatio, 1)}
            warning={result.ltvRatio > 80}
            warningText="PMI required"
          />

          {/* Monthly P&I */}
          <ResultRow
            label="Monthly P&I"
            value={formatCurrencyWithCents(result.monthlyPI)}
            isBest={isLowestMonthlyPI}
            difference={calculateDifference(result.monthlyPI, highlights.lowestMonthlyPI)}
          />

          {/* PMI */}
          {result.monthlyPMI > 0 && (
            <ResultRow
              label="Monthly PMI"
              value={formatCurrencyWithCents(result.monthlyPMI)}
              sublabel="Until 80% LTV"
            />
          )}

          {/* Tax & Insurance */}
          <ResultRow
            label="Tax & Insurance"
            value={formatCurrencyWithCents(result.monthlyTax + result.monthlyInsurance)}
            sublabel="Estimated"
          />

          {/* Total Monthly */}
          <div className="pt-2 border-t border-gray-100">
            <ResultRow
              label="Total Monthly"
              value={formatCurrencyWithCents(result.monthlyTotal)}
              isBest={isLowestMonthlyTotal}
              difference={calculateDifference(result.monthlyTotal, highlights.lowestMonthlyTotal)}
              emphasized
            />
          </div>

          {/* Total Interest */}
          <ResultRow
            label="Total Interest"
            value={formatCurrency(result.totalInterest)}
            isBest={isLowestTotalInterest}
            difference={calculateDifference(result.totalInterest, highlights.lowestTotalInterest)}
          />

          {/* Total Cost */}
          <div className="pt-2 border-t border-gray-100">
            <ResultRow
              label="Total Cost"
              value={formatCurrency(result.totalPayments)}
              isBest={isLowestTotalCost}
              difference={calculateDifference(result.totalPayments, highlights.lowestTotalCost)}
              emphasized
              sublabel="Over loan term"
            />
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <p className="text-sm">Enter values to see results</p>
        </div>
      )}
    </div>
  );
}

interface ResultRowProps {
  label: string;
  value: string;
  isBest?: boolean;
  difference?: number;
  warning?: boolean;
  warningText?: string;
  sublabel?: string;
  emphasized?: boolean;
}

function ResultRow({
  label,
  value,
  isBest,
  difference,
  warning,
  warningText,
  sublabel,
  emphasized,
}: ResultRowProps) {
  return (
    <div className={`flex justify-between items-start ${emphasized ? 'text-base' : 'text-sm'}`}>
      <div className="flex flex-col">
        <span className={`${emphasized ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
          {label}
        </span>
        {sublabel && <span className="text-xs text-gray-400">{sublabel}</span>}
        {warning && warningText && (
          <span className="text-xs text-warning-600">{warningText}</span>
        )}
      </div>
      <div className="flex flex-col items-end">
        <span
          className={`font-mono ${emphasized ? 'font-bold' : 'font-medium'} ${
            isBest ? 'text-success-600 bg-success-50 px-2 py-0.5 rounded' : 'text-gray-900'
          }`}
        >
          {value}
        </span>
        {difference !== undefined && difference > 0 && (
          <span className="text-xs text-orange-500 font-mono">
            +{formatCurrency(difference)}
          </span>
        )}
      </div>
    </div>
  );
}
