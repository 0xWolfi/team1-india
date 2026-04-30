import type { Metadata } from "next";
import RegisterClient from "./RegisterClient";

export const metadata: Metadata = {
  title: "Register — Speedrun | Team1 India",
  description: "Register for the next Speedrun. Build fast. Ship faster.",
};

export default function SpeedrunRegisterPage() {
  return <RegisterClient />;
}
