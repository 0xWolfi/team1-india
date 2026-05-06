"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { CoreWrapper } from "@/components/core/CoreWrapper";
import { EMPTY_RUN_FORM, RunEditor, RunFormState, fromApiRun } from "../RunEditor";

export default function EditSpeedrunRunPage() {
  const { slug } = useParams<{ slug: string }>();
  const [initial, setInitial] = useState<RunFormState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/speedrun/runs/${encodeURIComponent(slug)}`, { cache: "no-store" })
      .then(async (r) => {
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || `HTTP ${r.status}`);
        }
        return r.json();
      })
      .then((data) => setInitial(fromApiRun(data.run ?? EMPTY_RUN_FORM)))
      .catch((e: Error) => setError(e.message || "Failed to load run"));
  }, [slug]);

  return (
    <CoreWrapper>
      {error ? (
        <div className="text-center py-12 text-sm">
          <p className="text-red-500 font-semibold mb-1">Failed to load run</p>
          <p className="text-zinc-500">{error}</p>
        </div>
      ) : !initial ? (
        <div className="text-center py-12 text-sm text-zinc-500">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-3" />
          Loading run...
        </div>
      ) : (
        <RunEditor mode="edit" initial={initial} originalSlug={slug} />
      )}
    </CoreWrapper>
  );
}
