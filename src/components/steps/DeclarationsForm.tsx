import React, { useState } from 'react'
import type { StepProps } from '../ApplicationWizard'

type Declarations = {
  outstandingJudgments: boolean
  delinquentFederalDebt: boolean
  partyToLawsuit: boolean
  conveyedTitleInLieu: boolean
  preForeclosureOrShortSale: boolean
  propertyForeclosed: boolean
  declaredBankruptcy: boolean
  borrowingDownPayment: boolean
  coMakerOnNote: boolean
  primaryResidenceIntent: boolean
  ownershipInterestPast3Years: boolean
  applyingForOtherMortgage: boolean
  applyingForNewCredit: boolean
  subjectToLien: boolean
  alimonyChildSupport: boolean
}

const DECLARATION_QUESTIONS: { key: keyof Declarations; label: string; category: string }[] = [
  { key: 'outstandingJudgments', label: 'Are there any outstanding judgments against you?', category: 'Financial' },
  { key: 'delinquentFederalDebt', label: 'Are you currently delinquent or in default on a federal debt?', category: 'Financial' },
  { key: 'partyToLawsuit', label: 'Are you a party to a lawsuit?', category: 'Legal' },
  { key: 'conveyedTitleInLieu', label: 'Have you conveyed title to any property in lieu of foreclosure in the past 7 years?', category: 'Property' },
  { key: 'preForeclosureOrShortSale', label: 'Have you completed a pre-foreclosure sale or short sale in the past 7 years?', category: 'Property' },
  { key: 'propertyForeclosed', label: 'Have you had property foreclosed upon in the last 7 years?', category: 'Property' },
  { key: 'declaredBankruptcy', label: 'Have you declared bankruptcy within the past 7 years?', category: 'Financial' },
  { key: 'borrowingDownPayment', label: 'Are you borrowing any money for this transaction (down payment, closing costs)?', category: 'Transaction' },
  { key: 'coMakerOnNote', label: 'Are you a co-signer or guarantor on any debt not disclosed?', category: 'Financial' },
  { key: 'primaryResidenceIntent', label: 'Will you occupy the property as your primary residence?', category: 'Property' },
  { key: 'ownershipInterestPast3Years', label: 'Have you had an ownership interest in another property in the last 3 years?', category: 'Property' },
  { key: 'applyingForOtherMortgage', label: 'Are you applying for any other mortgage that will remain outstanding?', category: 'Transaction' },
  { key: 'applyingForNewCredit', label: 'Are you applying for any new credit not disclosed?', category: 'Financial' },
  { key: 'subjectToLien', label: 'Will this property be subject to a lien not disclosed?', category: 'Property' },
  { key: 'alimonyChildSupport', label: 'Are you obligated to pay alimony, child support, or separate maintenance?', category: 'Financial' }
]

export default function DeclarationsForm({ data, borrowerIndex, onUpdate, onNext, onBack }: StepProps) {
  const existingDeclarations = data.declarations?.declarations || {}

  const [declarations, setDeclarations] = useState<Declarations>({
    outstandingJudgments: existingDeclarations.outstandingJudgments || false,
    delinquentFederalDebt: existingDeclarations.delinquentFederalDebt || false,
    partyToLawsuit: existingDeclarations.partyToLawsuit || false,
    conveyedTitleInLieu: existingDeclarations.conveyedTitleInLieu || false,
    preForeclosureOrShortSale: existingDeclarations.preForeclosureOrShortSale || false,
    propertyForeclosed: existingDeclarations.propertyForeclosed || false,
    declaredBankruptcy: existingDeclarations.declaredBankruptcy || false,
    borrowingDownPayment: existingDeclarations.borrowingDownPayment || false,
    coMakerOnNote: existingDeclarations.coMakerOnNote || false,
    primaryResidenceIntent: existingDeclarations.primaryResidenceIntent ?? true,
    ownershipInterestPast3Years: existingDeclarations.ownershipInterestPast3Years || false,
    applyingForOtherMortgage: existingDeclarations.applyingForOtherMortgage || false,
    applyingForNewCredit: existingDeclarations.applyingForNewCredit || false,
    subjectToLien: existingDeclarations.subjectToLien || false,
    alimonyChildSupport: existingDeclarations.alimonyChildSupport || false
  })

  function updateDeclaration(key: keyof Declarations, value: boolean) {
    setDeclarations({ ...declarations, [key]: value })
  }

  function handleSave() {
    onUpdate('declarations', { declarations })
    onNext()
  }

  // Group by category
  const categories = ['Financial', 'Property', 'Transaction', 'Legal']

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Declarations</h3>
      <p className="text-sm text-gray-600 mb-4">
        Please answer the following questions truthfully. These declarations are required by federal law.
      </p>

      {categories.map(category => {
        const questions = DECLARATION_QUESTIONS.filter(q => q.category === category)
        if (questions.length === 0) return null

        return (
          <div key={category} className="mb-6">
            <h4 className="font-medium text-gray-700 mb-3">{category}</h4>
            <div className="space-y-3">
              {questions.map(q => (
                <div key={q.key} className="flex items-start gap-4 p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <span className="text-sm">{q.label}</span>
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        name={q.key}
                        checked={declarations[q.key] === true}
                        onChange={() => updateDeclaration(q.key, true)}
                      />
                      <span className="text-sm">Yes</span>
                    </label>
                    <label className="flex items-center gap-1">
                      <input
                        type="radio"
                        name={q.key}
                        checked={declarations[q.key] === false}
                        onChange={() => updateDeclaration(q.key, false)}
                      />
                      <span className="text-sm">No</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm mb-4">
        <strong>Note:</strong> If you answered "Yes" to any questions, you may need to provide additional documentation or explanations.
      </div>

      <div className="mt-6 flex justify-between">
        <button type="button" onClick={onBack} className="btn bg-gray-200 text-gray-700">
          Back
        </button>
        <button type="button" onClick={handleSave} className="btn">
          Save & Continue
        </button>
      </div>
    </div>
  )
}
