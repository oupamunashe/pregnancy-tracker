"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Client-side redirect (works under a static export and a GitHub Pages base path). */
export default function Home() {
  const router = useRouter();
  useEffect(() => router.replace("/dashboard"), [router]);
  return <p className="text-center text-gray-500 py-20">Loading… <Link href="/dashboard" className="underline">Continue</Link></p>;
}
