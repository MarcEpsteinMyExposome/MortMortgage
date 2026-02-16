import { useRouter } from 'next/router'
import Link from 'next/link'

export default function Confirmation() {
  const router = useRouter()
  const { id } = router.query

  return (
    <main className="p-6 bg-gray-100 min-h-screen">
      <div className="max-w-2xl mx-auto text-center">
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-green-500 text-6xl mb-4">✓</div>
          <h1 className="text-2xl font-bold mb-4">Application Submitted!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for submitting your mortgage application. Your application ID is:
          </p>
          <p className="font-mono bg-gray-100 p-3 rounded mb-6">{id}</p>

          <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-6 text-left">
            <h3 className="font-semibold mb-2">What happens next?</h3>
            <ol className="list-decimal list-inside text-sm space-y-1">
              <li>Our team will review your application</li>
              <li>We may contact you for additional documentation</li>
              <li>You'll receive a decision within 3-5 business days</li>
            </ol>
          </div>

          <div className="flex justify-center gap-4">
            <Link href="/" className="btn bg-gray-200 text-gray-700">
              Return Home
            </Link>
            <Link href="/dashboard" className="btn">
              View Your Applications
            </Link>
          </div>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Demo: This is a simulated mortgage application. No real data is processed.
        </p>
      </div>
    </main>
  )
}
