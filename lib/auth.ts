import CredentialsProvider from 'next-auth/providers/credentials'
import type { JWT } from 'next-auth/jwt'
import type { Session } from 'next-auth'
import type { NextAuthOptions } from 'next-auth'
import bcrypt from 'bcryptjs'
import connectDB from './db'
import User from '@/models/User'

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        await connectDB()
        
        const user = await User.findOne({ email: credentials.email })
        
        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        )

        if (!isPasswordValid) {
          return null
        }
        const isEarlyAccessApproved =
          typeof user.earlyAccessApproved === 'boolean' ? user.earlyAccessApproved : true


        if (!isEarlyAccessApproved) {
          throw new Error('Your account is waiting for Early Access approval.')
        }


        // Use plan from MongoDB user document
        // Payment service subscription will be fetched after login when needed
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          plan: user.plan || 'Free',
          isInTrial: user.isInTrial || false,
          trialEndDate: user.trialEndDate || null,
          earlyAccessApproved: isEarlyAccessApproved,
        }
      }
    })
  ],
  session: {
    strategy: 'jwt' as const,
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }: { token: JWT; user: any }) {
      if (user) {
        token.id = user.id
        token.plan = user.plan
        token.isInTrial = user.isInTrial
        token.trialEndDate = user.trialEndDate
        token.earlyAccessApproved = typeof user.earlyAccessApproved === 'boolean'
          ? user.earlyAccessApproved
          : true
      }

      return token
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        session.user.id = token.id as string
        session.user.plan = token.plan as string
        session.user.isInTrial = token.isInTrial as boolean
        session.user.trialEndDate = token.trialEndDate as Date | null
        session.user.earlyAccessApproved =
          typeof token.earlyAccessApproved === 'boolean' ? token.earlyAccessApproved : true
      }
      return session
    },
  },
} 