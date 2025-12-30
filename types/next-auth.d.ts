import NextAuth from 'next-auth'

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string
    plan?: string
    isInTrial?: boolean
    trialEndDate?: Date | null
    earlyAccessApproved?: boolean
  }
}

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      plan: string
      isInTrial: boolean
      trialEndDate: Date | null
      earlyAccessApproved: boolean
    }
  }

  interface User {
    id: string
    email: string
    name: string
    plan: string
    isInTrial: boolean
    trialEndDate: Date | null
    earlyAccessApproved: boolean
  }
} 