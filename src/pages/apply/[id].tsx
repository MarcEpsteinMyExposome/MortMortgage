import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import ApplicationWizard, { WizardStep } from '../../components/ApplicationWizard'
import {
  IdentityStep,
  AddressForm,
  MilitaryServiceForm,
  EmploymentForm,
  RealEstateOwnedForm,
  AssetsForm,
  LiabilitiesForm,
  PropertyForm,
  LoanForm,
  DeclarationsForm,
  DemographicsForm,
  DocumentsStep
} from '../../components/steps'

const WIZARD_STEPS: WizardStep[] = [
  { id: 'identity', title: 'Identity', component: IdentityStep },
  { id: 'address', title: 'Address', component: AddressForm },
  { id: 'military', title: 'Military', component: MilitaryServiceForm },
  { id: 'employment', title: 'Employment', component: EmploymentForm },
  { id: 'realEstate', title: 'Real Estate', component: RealEstateOwnedForm },
  { id: 'assets', title: 'Assets', component: AssetsForm },
  { id: 'liabilities', title: 'Liabilities', component: LiabilitiesForm },
  { id: 'property', title: 'Property', component: PropertyForm },
  { id: 'loan', title: 'Loan', component: LoanForm },
  { id: 'declarations', title: 'Declarations', component: DeclarationsForm },
  { id: 'demographics', title: 'Demographics', component: DemographicsForm },
  { id: 'documents', title: 'Documents', component: DocumentsStep }
]

export default function Apply() {
  const router = useRouter()
  const { id } = router.query

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [appData, setAppData] = useState<any>(null)

  useEffect(() => {
    if (!id) return

    async function loadApp() {
      try {
        const res = await fetch(`/api/apps/${id}`)
        if (!res.ok) throw new Error('Failed to load application')
        const data = await res.json()
        setAppData(data)
      } catch (err: any) {
        setError(err?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    loadApp()
  }, [id])

  async function handleSave(data: any) {
    const res = await fetch(`/api/apps/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          loan: data.loan,
          property: data.property,
          assets: data.assets,
          liabilities: data.liabilities,
          declarations: data.declarations,
          demographics: data.demographics,
          realEstate: data.realEstate
        },
        borrowers: data.borrowers
      })
    })

    if (!res.ok) {
      throw new Error('Failed to save')
    }
  }

  function handleComplete() {
    router.push(`/apply/${id}/review`)
  }

  if (loading) {
    return (
      <main className="p-6">
        <p>Loading application...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="p-6">
        <p className="text-red-600">{error}</p>
        <Link href="/" className="text-blue-600 hover:underline">Return home</Link>
      </main>
    )
  }

  // Prepare initial data structure for wizard
  const initialData = {
    borrowers: appData.borrowers || [{}],
    loan: appData.data?.loan || {},
    property: appData.data?.property || {},
    assets: appData.data?.assets || {},
    liabilities: appData.data?.liabilities || {},
    declarations: appData.data?.declarations || {},
    demographics: appData.data?.demographics || {},
    realEstate: appData.data?.realEstate || { propertiesOwned: [] }
  }

  return (
    <main className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/" className="text-blue-600 hover:underline text-sm">← Back to Home</Link>
            <h1 className="text-2xl font-bold mt-2">Mortgage Application</h1>
            <p className="text-sm text-gray-500">Application ID: {id}</p>
          </div>
          <span className={`px-3 py-1 rounded text-sm ${
            appData.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
            appData.status === 'submitted' ? 'bg-blue-100 text-blue-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {appData.status}
          </span>
        </div>

        <ApplicationWizard
          steps={WIZARD_STEPS}
          initialData={initialData}
          onSave={handleSave}
          onComplete={handleComplete}
        />

        <p className="mt-6 text-sm text-gray-500 text-center">
          Demo: All data is synthetic for presentation only.
        </p>
      </div>
    </main>
  )
}
