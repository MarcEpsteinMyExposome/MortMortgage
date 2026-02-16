import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from '../../../lib/prisma'

// Demo users (in production, use bcrypt for password hashing)
const DEMO_USERS = [
  {
    id: 'demo-borrower-1',
    email: 'borrower@demo.com',
    password: 'demo123',
    name: 'Demo Borrower',
    role: 'BORROWER'
  },
  {
    id: 'demo-supervisor-1',
    email: 'supervisor@demo.com',
    password: 'demo123',
    name: 'Maria Rodriguez',
    role: 'SUPERVISOR'
  },
  {
    id: 'demo-caseworker-1',
    email: 'caseworker1@demo.com',
    password: 'demo123',
    name: 'Sarah Chen',
    role: 'CASEWORKER'
  },
  {
    id: 'demo-caseworker-2',
    email: 'caseworker2@demo.com',
    password: 'demo123',
    name: 'James Wilson',
    role: 'CASEWORKER'
  },
  {
    id: 'demo-caseworker-3',
    email: 'caseworker3@demo.com',
    password: 'demo123',
    name: 'Priya Patel',
    role: 'CASEWORKER'
  },
  {
    id: 'demo-caseworker-4',
    email: 'caseworker4@demo.com',
    password: 'demo123',
    name: 'Marcus Johnson',
    role: 'CASEWORKER'
  }
]

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email', placeholder: 'borrower@demo.com' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Check demo users first
        const demoUser = DEMO_USERS.find(
          u => u.email === credentials.email && u.password === credentials.password
        )

        if (demoUser) {
          return {
            id: demoUser.id,
            email: demoUser.email,
            name: demoUser.name,
            role: demoUser.role
          }
        }

        // Check database users
        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email }
          })

          if (user) {
            // In demo mode, accept any password for existing users
            // In production, verify with bcrypt.compare()
            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role
            }
          }
        } catch (err) {
          console.error('Auth error:', err)
        }

        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.id = user.id
      }
      // Fallback: map legacy ADMIN role to SUPERVISOR
      if (token.role === 'ADMIN') {
        token.role = 'SUPERVISOR'
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role
        session.user.id = token.id
      }
      return session
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  session: {
    strategy: 'jwt'
  },
  secret: process.env.NEXTAUTH_SECRET || 'demo_secret_change_in_production'
}

export default NextAuth(authOptions)
