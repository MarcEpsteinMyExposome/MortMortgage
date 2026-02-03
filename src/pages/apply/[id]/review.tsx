import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function ReviewApplication() {
  const router = useRouter()
  const { id } = router.query

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
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

  async function handleSubmit() {
    setSubmitting(true)
    try {
      const res = await fetch(`/api/apps/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'submitted' })
      })

      if (!res.ok) throw new Error('Failed to submit')

      router.push(`/apply/${id}/confirmation`)
    } catch (err: any) {
      setError(err?.message || 'Failed to submit')
      setSubmitting(false)
    }
  }

  if (loading) {
    return <main className="p-6"><p>Loading...</p></main>
  }

  if (error) {
    return (
      <main className="p-6">
        <p className="text-red-600">{error}</p>
        <Link href="/" className="text-blue-600 hover:underline">Return home</Link>
      </main>
    )
  }

  const borrower = appData.borrowers?.[0] || {}
  const loan = appData.data?.loan || {}
  const property = appData.data?.property || {}

  return (
    <main className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-3xl mx-auto">
        <Link href={`/apply/${id}`} className="text-blue-600 hover:underline text-sm">← Back to Application</Link>

        <h1 className="text-2xl font-bold mt-4 mb-6">Review Your Application</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Borrower Information</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Name:</span>
              <span className="ml-2">{borrower.name?.firstName} {borrower.name?.lastName}</span>
            </div>
            <div>
              <span className="text-gray-500">Citizenship:</span>
              <span className="ml-2">{borrower.citizenship?.replace(/_/g, ' ')}</span>
            </div>
            {borrower.currentAddress?.address && (
              <div className="col-span-2">
                <span className="text-gray-500">Address:</span>
                <span className="ml-2">
                  {borrower.currentAddress.address.street}, {borrower.currentAddress.address.city}, {borrower.currentAddress.address.state} {borrower.currentAddress.address.zip}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Loan Details</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Purpose:</span>
              <span className="ml-2 capitalize">{loan.loanPurpose}</span>
            </div>
            <div>
              <span className="text-gray-500">Type:</span>
              <span className="ml-2 capitalize">{loan.loanType}</span>
            </div>
            <div>
              <span className="text-gray-500">Amount:</span>
              <span className="ml-2">${(loan.loanAmount || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-500">Term:</span>
              <span className="ml-2">{(loan.loanTermMonths || 360) / 12} years</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Property</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {property.address && (
              <div className="col-span-2">
                <span className="text-gray-500">Address:</span>
                <span className="ml-2">
                  {property.address.street}, {property.address.city}, {property.address.state} {property.address.zip}
                </span>
              </div>
            )}
            <div>
              <span className="text-gray-500">Type:</span>
              <span className="ml-2 capitalize">{property.propertyType?.replace(/_/g, ' ')}</span>
            </div>
            <div>
              <span className="text-gray-500">Value:</span>
              <span className="ml-2">${(property.propertyValue || 0).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-500">Occupancy:</span>
              <span className="ml-2 capitalize">{property.occupancy?.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-6">
          <p className="text-sm">
            <strong>Important:</strong> By clicking "Submit Application" below, you certify that the information
            provided is true and complete to the best of your knowledge.
          </p>
        </div>

        <div className="flex gap-4">
          <Link href={`/apply/${id}`} className="btn bg-gray-200 text-gray-700">
            Edit Application
          </Link>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn"
          >
            {submitting ? 'Submitting...' : 'Submit Application'}
          </button>
        </div>

        <p className="mt-6 text-sm text-gray-500 text-center">
          Demo: All data is synthetic for presentation only.
        </p>
      </div>
    </main>
  )
}
