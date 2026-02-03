import { useRouter } from 'next/router'
import IdentityForm from '../../components/IdentityForm'

export default function NewApplication() {
  const router = useRouter()

  async function handleSubmit(borrower: any) {
    // Create minimal application draft
    const payload = {
      status: 'draft',
      data: { product: 'Conventional', loanAmount: 0 },
      borrowers: [borrower]
    }

    const res = await fetch('/api/apps', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!res.ok) throw new Error('Failed to create application')
    const app = await res.json()
    // Redirect to application editor
    router.push(`/apply/${app.id}`)
  }

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Start a new application</h1>
      <div className="mt-4">
        <IdentityForm onSubmit={handleSubmit} />
      </div>
      <div className="mt-6 text-sm text-gray-600">Demo: all data is synthetic for presentation only.</div>
    </main>
  )
}
