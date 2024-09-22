import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { prisma } from "@/lib/prisma";
import { PrismaAdapter } from "@auth/prisma-adapter";

export const { handlers, auth } = NextAuth({
    adapter: PrismaAdapter(prisma),
    providers: [
        Google({
            //allowDangerousEmailAccountLinking: true,
            profile(profile) {
                const role = profile.email === "courseflow.team@gmail.com" ? "ADMIN" : "USER";
                return {
                    email: profile.email,
                    name: profile.name,
                    image: profile.picture,
                    emailVerified: profile.email_verified,
                    role,
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

        async signIn({ user, account }) {
            console.log(account, "account");
            console.log(user, "user");

            if (!user.email) {
                throw new Error("User email is missing");
            }
            // Check if the OAuth account is already linked to an existing user account
            const linkedAccount = await prisma.user.findUnique({
                where: {
                    email: user.email,
                },
            });

            console.log(linkedAccount, "linkedAccount");
            return true;
        },
    },

    events: {
        async createUser({ user }) {
            // Assign first user as ADMIN role
            const isFirstUser = (await prisma.user.count()) === 1;
            await prisma.user.update({
                where: { id: user.id },
                data: { role: isFirstUser ? "ADMIN" : "USER" },
            });
        },
    },
});
