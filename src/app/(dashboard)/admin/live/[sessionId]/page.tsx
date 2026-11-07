import React from "react";
import { LiveSessionTable } from "@/components/admin/LiveSessionTable";

export const dynamic = "force-dynamic";

interface LivePageProps {
  params: Promise<{
    sessionId: string;
  }>;
}

export default async function AdminLivePage({ params }: LivePageProps) {
  const { sessionId } = await params;
  return <LiveSessionTable sessionId={sessionId} role="admin" />;
}
