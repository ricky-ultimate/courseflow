import NextAuth from "next-auth"
import Google from "next-auth/providers/google"
import {prisma} from "@/lib/prisma"
import { PrismaAdapter } from "@auth/prisma-adapter";

export const { handlers, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      profile(profile) {
        //const role = profile.role === "admin" ? "ADMIN" : "USER";
        const role = profile.email === "courseflow.team@gmail.com" ? "ADMIN" : "USER";
        return {
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          role,
          emailVerified: profile.email_verified,
        }
      }
    })
  ],
  pages: {
    signIn: "/auth/signin"
  },
  callbacks: {
    async session({ session, user }) {
      session.user.role = user.role
      return session
    }
  }
})
