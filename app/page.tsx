import { redirect } from "next/navigation";

// Dashboard and Analytics were removed — the Trade Journal is the home page.
export default function HomePage() {
  redirect("/trades");
}
