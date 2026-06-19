import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-32 text-center">
      <div className="text-5xl font-bold text-brand">404</div>
      <p className="text-muted mt-2">This page isn&apos;t in your cockpit.</p>
      <Link href="/trades" className="btn-primary mt-5">
        Back to Journal
      </Link>
    </div>
  );
}
