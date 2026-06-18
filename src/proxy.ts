import { withAuth } from "next-auth/middleware";

const authMiddleware = withAuth({
  pages: {
    signIn: "/login",
  },
});

export default authMiddleware;

export function proxy(request: any, event: any) {
  return (authMiddleware as any)(request, event);
}

export const config = {
  matcher: [
    "/room/:path*",
    "/profile/setup",
  ],
};
