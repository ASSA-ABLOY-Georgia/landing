/**
 * "რატომ ASSA ABLOY?" facts — the five stat tiles of the navy band (PLAN §2, §7).
 *
 * Source: CONTENT.md → Home → "Why ASSA ABLOY — heading + 5 stats
 * [CLIENT — VERBATIM]". Text copied **byte-for-byte**; icons are the ones
 * CONTENT.md prescribes (globe/users/trophy/lightbulb/lock) and carry the
 * sanctioned cyan accent on navy.
 *
 * Note (CONTENT.md, kept as written): the Home stat says „60 000-ზე მეტი" while
 * About says „დაახლოებით 64 000" — both are client copy; PLAN §9 flags the
 * mismatch for the client rather than resolving it here.
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
