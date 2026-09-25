import type { Metadata } from "next";
import { AdminView } from "@/components/admin-view";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminView />;
}
