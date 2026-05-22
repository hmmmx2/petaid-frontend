import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    role?: string;
    error?: string;
    user?: DefaultSession["user"];
  }
  interface User {
    role?: string;
    accessToken?: string;
    refreshToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    role?: string;
    accessTokenExpires?: number;
    error?: string;
  }
}
