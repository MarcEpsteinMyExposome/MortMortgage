import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Link from 'next/link'

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'submitted', label: 'Submitted', color: 'bg-blue-100 text-blue-800' },
  { value: 'pending_documents', label: 'Pending Documents', color: 'bg-orange-100 text-orange-800' },
  { value: 'approved', label: 'Approved', color: 'bg-green-100 text-green-800' },
  { value: 'denied', label: 'Denied', color: 'bg-red-100 text-red-800' }
]

export default function AdminAppDetail() {
  const router = useRouter()
  const { id } = router.query

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [app, setApp] = useState<any>(null)
  const [updating, setUpdating] = useState(false)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (!id) return

    async function loadApp() {
      try {
        const res = await fetch(`/api/apps/${id}`)
        if (!res.ok) throw new Error('Failed to load')
        const data = await res.json()
        setApp(data)
      } catch (err: any) {
        setError(err?.message || 'Failed to load')
      } finally {
        setLoading(false)
      }
    }

    loadApp()
  }, [id])

  async function handleStatusChange(newStatus: string) {
    setUpdating(true)
    try {
      const res = await fetch(`/api/apps/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (!res.ok) throw new Error('Failed to update')
      const updated = await res.json()
      setApp(updated)
    } catch (err) {
      alert('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  async function handleExport(format: 'json' | 'xml') {
    setExporting(true)
    try {
      const res = await fetch(`/api/apps/${id}/export?format=${format}`)
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'Export failed')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `loan-${id}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      alert(err?.message || 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  async function handleExportPdf() {
    setExporting(true)
    try {
      const res = await fetch(`/api/apps/${id}/pdf`)
      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || 'PDF export failed')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `URLA-${id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err: any) {
      alert(err?.message || 'PDF export failed')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <main className="p-6"><p>Loading...</p></main>
  }

  if (error || !app) {
    return (
      <main className="p-6">
        <p className="text-red-600">{error || 'Application not found'}</p>
        <Link href="/admin" className="text-blue-600 hover:underline">Back to Admin</Link>
      </main>
    )
  }

  const borrower = app.borrowers?.[0] || {}
  const loan = app.data?.loan || {}
  const property = app.data?.property || {}
  const assets = app.data?.assets?.assets || []
  const liabilities = app.data?.liabilities?.liabilities || []
  const declarations = app.data?.declarations?.declarations || {}

  const totalAssets = assets.reduce((sum: number, a: any) => sum + (a.balance || 0), 0)
  const totalLiabilities = liabilities.reduce((sum: number, l: any) => sum + (l.balance || 0), 0)
  const monthlyDebt = liabilities.reduce((sum: number, l: any) => sum + (l.monthlyPayment || 0), 0)

  return (
    <main className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/admin" className="text-blue-600 hover:underline text-sm">← Back to Admin</Link>
            <h1 className="text-2xl font-bold mt-2">Application Details</h1>
            <p className="text-sm text-gray-500 font-mono">{app.id}</p>
          </div>
          <div className="flex items-center gap-4">
            {/* Status Management */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <select
                value={app.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                disabled={updating}
                className={`input w-auto ${STATUS_OPTIONS.find(s => s.value === app.status)?.color}`}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-semibold mb-3">Export Application</h3>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleExportPdf()}
              disabled={exporting}
              className="btn bg-red-600"
            >
              {exporting ? 'Exporting...' : 'Export URLA PDF'}
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="btn bg-blue-600"
            >
              {exporting ? 'Exporting...' : 'Export MISMO JSON'}
            </button>
            <button
              onClick={() => handleExport('xml')}
              disabled={exporting}
              className="btn bg-green-600"
            >
              {exporting ? 'Exporting...' : 'Export MISMO XML'}
            </button>
            <Link href={`/apply/${id}`} className="btn bg-gray-600">
              Edit Application
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm text-gray-500 mb-1">Loan Amount</h3>
            <div className="text-2xl font-bold">${(loan.loanAmount || 0).toLocaleString()}</div>
            <div className="text-sm text-gray-600">{loan.loanType || 'Conventional'} - {(loan.loanTermMonths || 360) / 12} years</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm text-gray-500 mb-1">Property Value</h3>
            <div className="text-2xl font-bold">${(property.propertyValue || 0).toLocaleString()}</div>
            <div className="text-sm text-gray-600">
              LTV: {property.propertyValue ? ((loan.loanAmount / property.propertyValue) * 100).toFixed(1) : 0}%
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-sm text-gray-500 mb-1">Net Worth</h3>
            <div className={`text-2xl font-bold ${totalAssets - totalLiabilities >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${(totalAssets - totalLiabilities).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Monthly debt: ${monthlyDebt.toLocaleString()}</div>
          </div>
        </div>

        {/* Borrower Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Borrower Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm text-gray-500">Name</h4>
              <p>{borrower.name?.firstName} {borrower.name?.middleName} {borrower.name?.lastName} {borrower.name?.suffix}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">SSN</h4>
              <p className="font-mono">{borrower.ssn || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Date of Birth</h4>
              <p>{borrower.dob || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Citizenship</h4>
              <p className="capitalize">{borrower.citizenship?.replace(/_/g, ' ') || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Email</h4>
              <p>{borrower.contact?.email || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Phone</h4>
              <p>{borrower.contact?.cellPhone || '-'}</p>
            </div>
            {borrower.currentAddress?.address && (
              <div className="col-span-2">
                <h4 className="text-sm text-gray-500">Current Address</h4>
                <p>
                  {borrower.currentAddress.address.street}
                  {borrower.currentAddress.address.unit && `, ${borrower.currentAddress.address.unit}`}
                  <br />
                  {borrower.currentAddress.address.city}, {borrower.currentAddress.address.state} {borrower.currentAddress.address.zip}
                </p>
                <p className="text-sm text-gray-600">
                  {borrower.currentAddress.housingType === 'own' ? 'Owns' :
                   borrower.currentAddress.housingType === 'rent' ? `Rents ($${borrower.currentAddress.monthlyRent}/mo)` :
                   'Living rent-free'}
                  {' - '}
                  {borrower.currentAddress.durationYears || 0} years, {borrower.currentAddress.durationMonths || 0} months
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Employment */}
        {borrower.employment && borrower.employment.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Employment</h2>
            {borrower.employment.map((emp: any, i: number) => (
              <div key={i} className={`${i > 0 ? 'mt-4 pt-4 border-t' : ''}`}>
                <div className="flex justify-between">
                  <div>
                    <p className="font-medium">{emp.employerName}</p>
                    <p className="text-sm text-gray-600">{emp.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${(emp.monthlyIncome || 0).toLocaleString()}/mo</p>
                    <p className="text-sm text-gray-600">{emp.current ? 'Current' : 'Previous'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Property */}
        {property.address && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">Subject Property</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <h4 className="text-sm text-gray-500">Address</h4>
                <p>
                  {property.address.street}
                  {property.address.unit && `, ${property.address.unit}`}
                  <br />
                  {property.address.city}, {property.address.state} {property.address.zip}
                </p>
              </div>
              <div>
                <h4 className="text-sm text-gray-500">Property Type</h4>
                <p className="capitalize">{property.propertyType?.replace(/_/g, ' ') || '-'}</p>
              </div>
              <div>
                <h4 className="text-sm text-gray-500">Occupancy</h4>
                <p className="capitalize">{property.occupancy?.replace(/_/g, ' ') || '-'}</p>
              </div>
              <div>
                <h4 className="text-sm text-gray-500">Units</h4>
                <p>{property.numberOfUnits || 1}</p>
              </div>
              <div>
                <h4 className="text-sm text-gray-500">Year Built</h4>
                <p>{property.yearBuilt || '-'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loan Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Loan Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <h4 className="text-sm text-gray-500">Purpose</h4>
              <p className="capitalize">{loan.loanPurpose || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Type</h4>
              <p className="capitalize">{loan.loanType || '-'}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Term</h4>
              <p>{(loan.loanTermMonths || 360) / 12} years</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Rate Type</h4>
              <p className="capitalize">{loan.interestRateType || 'Fixed'}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Down Payment</h4>
              <p>${(loan.downPayment?.amount || 0).toLocaleString()}</p>
            </div>
            <div>
              <h4 className="text-sm text-gray-500">Down Payment Source</h4>
              <p className="capitalize">{loan.downPayment?.source?.replace(/_/g, ' ') || '-'}</p>
            </div>
          </div>
        </div>

        {/* Assets & Liabilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Assets</h2>
            {assets.length === 0 ? (
              <p className="text-gray-500">No assets listed</p>
            ) : (
              <>
                {assets.map((asset: any, i: number) => (
                  <div key={i} className="flex justify-between py-2 border-b">
                    <div>
                      <p className="capitalize">{asset.type?.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-gray-500">{asset.institution}</p>
                    </div>
                    <p className="font-medium">${(asset.balance || 0).toLocaleString()}</p>
                  </div>
                ))}
                <div className="flex justify-between pt-4 font-semibold">
                  <span>Total</span>
                  <span className="text-green-600">${totalAssets.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold mb-4">Liabilities</h2>
            {liabilities.length === 0 ? (
              <p className="text-gray-500">No liabilities listed</p>
            ) : (
              <>
                {liabilities.map((liability: any, i: number) => (
                  <div key={i} className="flex justify-between py-2 border-b">
                    <div>
                      <p className="capitalize">{liability.type?.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-gray-500">{liability.creditor}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${(liability.balance || 0).toLocaleString()}</p>
                      <p className="text-sm text-gray-500">${liability.monthlyPayment}/mo</p>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between pt-4 font-semibold">
                  <span>Total</span>
                  <span className="text-red-600">${totalLiabilities.toLocaleString()}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Declarations Summary */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">Declarations Summary</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {Object.entries(declarations).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2">
                <span className={value ? 'text-red-600' : 'text-green-600'}>
                  {value ? '⚠' : '✓'}
                </span>
                <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Timestamps */}
        <div className="text-sm text-gray-500 text-center">
          <p>Created: {new Date(app.createdAt).toLocaleString()}</p>
          <p>Updated: {new Date(app.updatedAt).toLocaleString()}</p>
        </div>
      </div>
    </main>
  )
}
