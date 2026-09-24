import { Suspense } from "react";
import { TapeApp } from "@/components/tape-app";
import { getTape } from "@/lib/prestocks";

export const dynamic = "force-dynamic";

export default async function Home() {
  try {
    const tape = await getTape();
    return (
      <Suspense>
        <TapeApp initial={tape} />
      </Suspense>
    );
  } catch {
    return (
      <Suspense>
        <TapeApp />
      </Suspense>
    );
  }
}
