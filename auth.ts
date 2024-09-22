import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role, Account } from "@prisma/client";
import dotenv from 'dotenv';

dotenv.config();

const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];

export const { handlers, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      profile(profile) {
        return {
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          emailVerified: profile.email_verified,
        };
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async session({ session, user }) {
      session.user.role = user.role;
      return session;
    },

    async signIn({ user, account, profile }) {
    //   console.log(account, "account");
    //   console.log(user, "user");

      if (!user.email) {
        throw new Error("User email is missing");
      }

      // Find the user by email in the database
      const linkedAccount = await prisma.user.findUnique({
        where: {
          email: user.email ?? undefined,
        },
        include: {
          accounts: true,
        },
      });

      //console.log(linkedAccount, "linkedAccount");

      if (linkedAccount && account) {
        const googleAccountExists = linkedAccount.accounts.some((acc: Account) =>
          acc.provider === account.provider &&
          acc.providerAccountId === account.providerAccountId
        );

        if (!googleAccountExists) {
          await prisma.account.create({
            data: {
              userId: linkedAccount.id,
              type: account.type!,
              provider: account.provider!,
              providerAccountId: account.providerAccountId!,
              refresh_token: account.refresh_token || null,
              access_token: account.access_token || null,
              expires_at: account.expires_at || null,
              token_type: account.token_type || null,
              scope: account.scope || null,
              id_token: account.id_token || null,
              session_state:
                typeof account.session_state === "string"
                  ? account.session_state
                  : null,
            },
          });
        }
      }

      // Allow sign-in to proceed
      return true;
    },
  },

  events: {
    async createUser({ user }) {
      if (!user.email) {
        throw new Error("User email is missing");
      }

      const isAdmin = adminEmails.includes(user.email);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: isAdmin ? Role.ADMIN : Role.USER,
          emailVerified: new Date(), // Update emailVerified for new users
        },
      });

      console.log(`New user ${user.email} created with role ${isAdmin ? "ADMIN" : "USER"}`);
    },
  },
});
