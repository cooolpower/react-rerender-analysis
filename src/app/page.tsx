import { auth } from "@/lib/next-auth";
import { redirect } from "next/navigation";

export default async function HomePage(): Promise<React.JSX.Element> {
  const session = await auth();
  if (session) redirect("/dashboard");
  redirect("/login");
}
