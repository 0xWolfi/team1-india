"use client";

import { CoreWrapper } from "@/components/core/CoreWrapper";
import { EMPTY_RUN_FORM, RunEditor } from "../RunEditor";

export default function NewSpeedrunRunPage() {
  return (
    <CoreWrapper>
      <RunEditor mode="create" initial={EMPTY_RUN_FORM} />
    </CoreWrapper>
  );
}
