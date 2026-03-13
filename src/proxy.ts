export { auth as proxy } from "@/lib/next-auth";

export const config = {
  matcher: ["/dashboard/:path*"],
};
