import React, { useState, useEffect } from 'react'
import { validateStep, validateAllSteps, ValidationResult } from '../lib/form-validator'

export type WizardStep = {
  id: string
  title: string
  component: React.ComponentType<StepProps>
}

export type StepProps = {
  data: any
  borrowerIndex: number
  onUpdate: (section: string, value: any) => void
  onNext: () => void
  onBack: () => void
  isFirst: boolean
  isLast: boolean
  validation?: ValidationResult
}

type Props = {
  steps: WizardStep[]
  initialData: any
  onSave: (data: any) => Promise<void>
  onComplete: () => void
}

// Icons for step indicators
const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

const WarningIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)

const ErrorIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
)

export default function ApplicationWizard({ steps, initialData, onSave, onComplete }: Props) {
  const [currentStep, setCurrentStep] = useState(0)
  const [data, setData] = useState(initialData)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [stepValidation, setStepValidation] = useState<Record<string, ValidationResult>>({})
  const [showValidationPanel, setShowValidationPanel] = useState(false)

  const step = steps[currentStep]
  const StepComponent = step.component
  const currentValidation = stepValidation[step.id]

  // Validate all steps when data changes
  useEffect(() => {
    const results = validateAllSteps(data)
    const validationMap: Record<string, ValidationResult> = {}
    results.forEach(r => {
      validationMap[r.stepId] = r.result
    })
    setStepValidation(validationMap)
  }, [data])

  async function handleUpdate(section: string, value: any) {
    const updated = { ...data, [section]: value }
    setData(updated)
    setError(null)

    // Auto-save on each update
    setSaving(true)
    try {
      await onSave(updated)
    } catch (err: any) {
      setError(err?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  function handleNext() {
    // Validate current step before allowing navigation
    const validation = validateStep(step.id, data)
    if (!validation.valid) {
      // Still allow navigation but show warnings
      setShowValidationPanel(true)
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      // Final step - check if all required fields are complete
      const allValid = Object.values(stepValidation).every(v => v.valid)
      if (!allValid) {
        setShowValidationPanel(true)
        alert('Please complete all required fields before submitting.')
        return
      }
      onComplete()
    }
  }

  function handleBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  function goToStep(index: number) {
    setCurrentStep(index)
  }

  function getStepStatus(stepId: string): 'valid' | 'warning' | 'error' | 'pending' {
    const validation = stepValidation[stepId]
    if (!validation) return 'pending'
    if (!validation.valid) return 'error'
    if (validation.warnings.length > 0) return 'warning'
    return 'valid'
  }

  const completedSteps = Object.values(stepValidation).filter(v => v.valid).length
  const totalSteps = steps.length
  const progressPercent = (completedSteps / totalSteps) * 100

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Header Card */}
      <div className="card p-6 mb-6">
        {/* Step Navigator */}
        <div className="mb-6 overflow-x-auto scrollbar-thin">
          <div className="flex items-center min-w-max">
            {steps.map((s, i) => {
              const status = getStepStatus(s.id)
              const isActive = i === currentStep
              const isPast = i < currentStep

              return (
                <React.Fragment key={s.id}>
                  {/* Step Circle */}
                  <button
                    onClick={() => goToStep(i)}
                    className={`
                      flex-shrink-0 flex flex-col items-center group relative
                      ${isActive ? 'z-10' : ''}
                    `}
                  >
                    <div
                      className={`
                        step-circle
                        ${isActive ? 'step-circle-active' : ''}
                        ${status === 'valid' && !isActive ? 'step-circle-completed' : ''}
                        ${status === 'warning' && !isActive ? 'step-circle-warning' : ''}
                        ${status === 'error' && isPast && !isActive ? 'step-circle-error' : ''}
                        ${!isActive && status === 'pending' ? 'step-circle-pending' : ''}
                        ${!isActive ? 'hover:ring-2 hover:ring-primary-200' : ''}
                      `}
                    >
                      {status === 'valid' && !isActive ? <CheckIcon /> :
                       status === 'warning' && !isActive ? <WarningIcon /> :
                       status === 'error' && isPast && !isActive ? <ErrorIcon /> :
                       i + 1}
                    </div>
                    <span
                      className={`
                        mt-2 text-xs font-medium transition-colors whitespace-nowrap
                        ${isActive ? 'text-primary-600' : 'text-gray-500 group-hover:text-gray-700'}
                      `}
                    >
                      {s.title}
                    </span>
                  </button>

                  {/* Connector Line */}
                  {i < steps.length - 1 && (
                    <div
                      className={`
                        step-line flex-shrink-0 w-8 md:w-12 lg:w-16
                        ${status === 'valid' ? 'step-line-completed' : 'step-line-pending'}
                      `}
                    />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Status Row */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-900">
              Step {currentStep + 1} of {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {step.title}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {saving && (
              <span className="inline-flex items-center gap-1.5 text-sm text-primary-600">
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            )}

            {error && (
              <span className="text-sm text-danger-600">{error}</span>
            )}

            <span className="text-sm text-gray-500">
              {completedSteps} of {totalSteps} complete
            </span>

            <button
              onClick={() => setShowValidationPanel(!showValidationPanel)}
              className="btn btn-sm btn-ghost"
            >
              {showValidationPanel ? 'Hide' : 'Show'} Issues
            </button>
          </div>
        </div>
      </div>

      {/* Validation Panel */}
      {showValidationPanel && currentValidation && (
        <div className="card overflow-hidden mb-6 animate-fade-in">
          {currentValidation.errors.length > 0 && (
            <div className="alert alert-error border-0 rounded-none">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Required Fields</h4>
                  <ul className="text-sm space-y-0.5">
                    {currentValidation.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {currentValidation.warnings.length > 0 && (
            <div className="alert alert-warning border-0 rounded-none">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Warnings</h4>
                  <ul className="text-sm space-y-0.5">
                    {currentValidation.warnings.map((warn, i) => (
                      <li key={i}>{warn}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {currentValidation.valid && currentValidation.warnings.length === 0 && (
            <div className="alert alert-success border-0 rounded-none">
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm font-medium">All required fields complete for this step.</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step Content */}
      <div className="card p-8 animate-fade-in">
        <StepComponent
          data={data}
          borrowerIndex={0}
          onUpdate={handleUpdate}
          onNext={handleNext}
          onBack={handleBack}
          isFirst={currentStep === 0}
          isLast={currentStep === steps.length - 1}
          validation={currentValidation}
        />
      </div>
    </div>
  )
}
