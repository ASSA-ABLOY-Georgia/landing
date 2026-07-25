/**
 * "რატომ ASSA ABLOY?" facts — the five stat tiles of the navy band. CONTENT.md →
 * Home → Why ASSA ABLOY, byte-for-byte; the icons carry the sanctioned cyan
 * accent on navy.
 *
 * ⚠ Kept as written: this says „60 000-ზე მეტი" while About says
 * „დაახლოებით 64 000". Both are client copy — the mismatch is theirs to resolve.
 */
import type { IconName } from "../components/Icon.astro";

export interface Stat {
  text: string;
  icon: IconName;
}

export const stats: Stat[] = [
  { text: "70+ ქვეყანაში ოპერირება", icon: "globe" },
  { text: "60 000-ზე მეტი თანამშრომელი მსოფლიოში", icon: "users" },
  { text: "მსოფლიო ლიდერი Access Solutions სფეროში", icon: "trophy" },
  { text: "მუდმივი ინოვაცია და კვლევა", icon: "lightbulb" },
  { text: "მექანიკური და ციფრული უსაფრთხოების სრული პორტფელი", icon: "lock" },
];
