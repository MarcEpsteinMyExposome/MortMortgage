import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'

export default function UserMenu() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return <div className="text-gray-400 text-sm">Loading...</div>
  }

  if (!session) {
    return (
      <Link href="/auth/signin" className="btn">
        Sign In
      </Link>
    )
  }

  const user = session.user as any

  return (
    <div className="flex items-center gap-4">
      <Link
        href="/dashboard"
        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
      >
        Dashboard
      </Link>
      {user.role === 'ADMIN' && (
        <Link
          href="/admin"
          className="text-sm text-gray-600 hover:text-gray-700 font-medium"
        >
          Admin
        </Link>
      )}
      <div className="text-sm">
        <div className="font-medium">{user.name || user.email}</div>
        <div className="text-gray-500 text-xs capitalize">
          {user.role?.toLowerCase() || 'borrower'}
        </div>
      </div>
      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className="text-sm text-red-600 hover:underline"
      >
        Sign Out
      </button>
    </div>
  )
}
