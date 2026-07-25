/**
 * The six solution cards — CONTENT.md → Home → Solutions, byte-for-byte. The
 * icon names are the ones CONTENT.md prescribes, resolved by Icon.astro.
 *
 * Rendered on Home (band 4, linked to /products) and Products (category grid).
 */
import type { IconName } from "../components/Icon.astro";

export interface Solution {
  title: string;
  body: string;
  icon: IconName;
}

export const solutions: Solution[] = [
  {
    title: "მექანიკური საკეტები",
    body: "მაღალი ხარისხის საკეტები საცხოვრებელი, კომერციული და სამრეწველო ობიექტებისთვის.",
    icon: "lock",
  },
  {
    title: "ციფრული წვდომა",
    body: "Smart Lock-ები, Mobile Access და Cloud-ზე დაფუძნებული მართვის სისტემები.",
    icon: "smartphone",
  },
  {
    title: "Access Control",
    body: "წვდომის კონტროლი ოფისებისთვის, ბიზნესცენტრებისთვის, საწარმოებისა და სახელმწიფო დაწესებულებებისთვის.",
    icon: "building",
  },
  {
    title: "ავტომატური კარები",
    body: "ავტომატური შესასვლელი სისტემები სხვადასხვა ტიპის შენობებისთვის.",
    icon: "door",
  },
  {
    title: "უსაფრთხოების კარები",
    body: "ხანძარსაწინააღმდეგო, უსაფრთხოების და სპეციალური დანიშნულების კარები.",
    icon: "shield",
  },
  {
    title: "იდენტიფიკაცია და ავთენტიფიკაცია",
    body: "ბიომეტრიული და თანამედროვე იდენტიფიკაციის ტექნოლოგიები.",
    icon: "id-badge",
  },
];
