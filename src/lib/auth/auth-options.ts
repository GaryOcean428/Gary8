import { AuthOptions } from 'next-auth';

export const authOptions: AuthOptions = {
  providers: [],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};
