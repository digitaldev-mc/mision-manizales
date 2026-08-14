import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/prisma";
import { isLoginRateLimited, recordLoginAttempt } from "@/lib/rateLimit";
import type { AdminRole } from "@prisma/client";

declare module "next-auth" {
  interface User {
    role: AdminRole;
  }
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: AdminRole;
    };
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    role: AdminRole;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: { strategy: "jwt", maxAge: 30 * 60 },
  pages: { signIn: "/admin/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        const ip =
          request.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ??
          request.headers?.get("x-real-ip") ??
          "unknown";

        if (!email || !password) return null;

        if (await isLoginRateLimited(email, ip)) {
          throw new Error("RATE_LIMIT");
        }

        const user = await prisma.adminUser.findUnique({ where: { email } });
        if (!user || !user.active) {
          await recordLoginAttempt(email, ip, false);
          return null;
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          await recordLoginAttempt(email, ip, false);
          return null;
        }

        await recordLoginAttempt(email, ip, true);
        await prisma.adminUser.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      return {
        ...session,
        user: {
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          role: token.role as AdminRole,
        },
      };
    },
  },
});

export async function requireAdmin(roles?: AdminRole[]) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("UNAUTHORIZED");
  }
  if (roles && !roles.includes(session.user.role)) {
    throw new Error("FORBIDDEN");
  }
  return session.user;
}
