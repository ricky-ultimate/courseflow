import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role } from "@prisma/client";

export const { handlers, auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      profile(profile) {
        const role =
          profile.email === "courseflow.team@gmail.com" ? "ADMIN" : "USER";
        return {
          email: profile.email,
          name: profile.name,
          image: profile.picture,
          emailVerified: profile.email_verified,
          role, // Assign the role based on the email
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
      console.log(account, "account");
      console.log(user, "user");

      if (!user.email) {
        throw new Error("User email is missing");
      }

      // Find the user by email in the database
      const linkedAccount = await prisma.user.findUnique({
        where: {
          email: user.email,
        },
        include: { accounts: true },
      });

      console.log(linkedAccount, "linkedAccount");

      if (linkedAccount) {
        // 1. Update `emailVerified` if necessary (from the database)
        if (!linkedAccount.emailVerified) {
          await prisma.user.update({
            where: { id: linkedAccount.id },
            data: {
              emailVerified: new Date(), // Update emailVerified with the current date
            },
          });
        }

        // 2. Update role if it's different (e.g., ADMIN to USER or vice versa)
        if (linkedAccount.role === "USER" && user.role === "ADMIN") {
          await prisma.user.update({
            where: { id: linkedAccount.id },
            data: { role: Role.ADMIN },
          });
        }

        // 3. Link the Google account to the existing user account
        if (account) {
          const googleAccountExists = linkedAccount.accounts.some(
            (acc) =>
              acc.provider === account.provider &&
              acc.providerAccountId === account.providerAccountId
          );

          // If the Google account is not linked, create the account entry in Prisma
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

        // Allow the sign-in to proceed
        return true;
      }

      // If no existing account is found, proceed with default behavior
      return true;
    },
  },

  events: {
    async createUser({ user }) {
      // Assign the first user as ADMIN role
      const isFirstUser = (await prisma.user.count()) === 1;
      await prisma.user.update({
        where: { id: user.id },
        data: { role: isFirstUser ? Role.ADMIN : Role.USER },
      });
    },
  },
});
