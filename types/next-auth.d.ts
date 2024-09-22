import NextAuth from 'next-auth';
import { DefaultSession } from 'next-auth';
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role?: string | null;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    }&DefaultSession["user"];
  }

  interface User {
    id: string;
    role?: string | null;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  }
}
