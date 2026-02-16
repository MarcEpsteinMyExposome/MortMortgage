import useSWR from 'swr'
import Link from 'next/link'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import UserMenu from '../../components/UserMenu'
import ApprovalRateBar from '../../components/charts/ApprovalRateBar'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export default function CaseworkerManagement() {
  const { data: session, status: sessionStatus } = useSession()
  const router = useRouter()
  const userRole = (session?.user as any)?.role

  // Redirect non-supervisors
  if (sessionStatus !== 'loading' && userRole !== 'SUPERVISOR') {
    if (typeof window !== 'undefined') {
      router.replace('/')
    }
    return null
  }
  const { data: caseworkers, error, mutate } = useSWR('/api/admin/caseworkers', fetcher)
  const [newName, setNewName] = useState('')
  const [newEmail, setNewEmail] = useState('')
  const [adding, setAdding] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  async function handleAddCaseworker(e: React.FormEvent) {
    e.preventDefault()
    if (!newName || !newEmail) return
    setAdding(true)
    try {
      const res = await fetch('/api/admin/caseworkers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, email: newEmail })
      })
      if (res.ok) {
        setNewName('')
        setNewEmail('')
        mutate()
      } else {
        const err = await res.json()
        alert(err.error || 'Failed to add caseworker')
      }
    } finally {
      setAdding(false)
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    setToggling(id)
    try {
      await fetch(`/api/admin/caseworkers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive })
      })
      mutate()
    } finally {
      setToggling(null)
    }
  }

  const activeCount = caseworkers?.filter((cw: any) => cw.active).length || 0
  const totalQueue = caseworkers?.reduce((s: number, cw: any) => s + cw.activeQueue, 0) || 0

  return (
    <main className="min-h-screen bg-gray-50">
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
              <span className="text-sm font-medium text-gray-600">Caseworker Management</span>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Caseworkers</h1>
            <p className="text-sm text-gray-500 mt-1">Manage caseworker team members</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin" className="btn btn-ghost">Supervisor Portal</Link>
          </div>
        </div>

        {/* Stats Bar */}
        {caseworkers && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="stat-card border-l-4 border-primary-500">
              <div className="stat-value text-primary-600">{caseworkers.length}</div>
              <div className="stat-label">Total Caseworkers</div>
            </div>
            <div className="stat-card border-l-4 border-success-500">
              <div className="stat-value text-success-600">{activeCount}</div>
              <div className="stat-label">Active</div>
            </div>
            <div className="stat-card border-l-4 border-purple-500">
              <div className="stat-value text-purple-600">{totalQueue}</div>
              <div className="stat-label">Total Active Cases</div>
            </div>
          </div>
        )}

        {/* Add Caseworker Form */}
        <div className="card p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Caseworker</h2>
          <form onSubmit={handleAddCaseworker} className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Full name"
                className="input w-full"
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@company.com"
                className="input w-full"
                required
              />
            </div>
            <button type="submit" disabled={adding} className="btn btn-primary disabled:opacity-50">
              {adding ? 'Adding...' : 'Add Caseworker'}
            </button>
          </form>
        </div>

        {/* Caseworkers Table */}
        <div className="card overflow-hidden">
          {error && (
            <div className="p-6 text-center text-red-600">Failed to load caseworkers</div>
          )}

          {!caseworkers && !error && (
            <div className="p-8 text-center text-gray-500">Loading...</div>
          )}

          {caseworkers && caseworkers.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="table-header">
                  <tr>
                    <th className="table-header-cell">Status</th>
                    <th className="table-header-cell">Name</th>
                    <th className="table-header-cell">Email</th>
                    <th className="table-header-cell">Active Queue</th>
                    <th className="table-header-cell">Completed</th>
                    <th className="table-header-cell">Approval Rate</th>
                    <th className="table-header-cell">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {caseworkers.map((cw: any) => (
                    <tr key={cw.id} className={`table-row ${!cw.active ? 'opacity-60' : ''}`}>
                      <td className="table-cell">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
                          cw.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cw.active ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {cw.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="table-cell font-medium">{cw.name}</td>
                      <td className="table-cell text-gray-500 text-sm">{cw.email}</td>
                      <td className="table-cell">{cw.activeQueue}</td>
                      <td className="table-cell">{cw.completedTotal}</td>
                      <td className="table-cell">
                        <ApprovalRateBar rate={cw.approvalRate} />
                      </td>
                      <td className="table-cell">
                        <button
                          onClick={() => handleToggleActive(cw.id, cw.active)}
                          disabled={toggling === cw.id}
                          className={`btn btn-sm ${cw.active ? 'btn-ghost text-danger-600' : 'btn-ghost text-success-600'} disabled:opacity-50`}
                        >
                          {toggling === cw.id ? '...' : cw.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-8 text-sm text-gray-500 text-center">
          Demo application. All data is synthetic for presentation purposes only.
        </p>
      </div>
    </main>
  )
}
