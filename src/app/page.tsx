import { redirect } from "next/navigation";

export default function Home() {
  // Temporary redirect to dashboard, this would navigate to login if unauthenticated in the future.
  redirect("/dashboard");
}
