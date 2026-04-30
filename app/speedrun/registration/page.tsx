import type { Metadata } from "next";
import RegistrationStatusClient from "./RegistrationStatusClient";

export const metadata: Metadata = {
  title: "My Registration — Speedrun | Team1 India",
};

export default function SpeedrunRegistrationStatusPage() {
  return <RegistrationStatusClient />;
}
