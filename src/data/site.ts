/**
 * Site-level data consumed by Header/Footer.
 *
 * Every Georgian string that exists in CONTENT.md is copied **byte-for-byte**.
 * Strings marked DERIVED are interface chrome CONTENT.md does not cover (menu
 * toggle labels, landmark labels); they follow the same Georgian voice and are
 * listed for client review.
 */

export interface NavItem {
  label: string;
  href: string;
}

/** CONTENT.md → Global → nav labels. Slugs stay Latin. */
export const navItems: NavItem[] = [
  { label: "მთავარი", href: "/" },
  { label: "ჩვენს შესახებ", href: "/about" },
  { label: "პროდუქტები", href: "/products" },
  { label: "კონტაქტი", href: "/contact" },
];

/** Placeholders, at the client's request. */
export const contact = {
  phone: "+995 32 2 00 00 00",
  phoneHref: "tel:+995322000000",
  email: "info@assaabloy.ge",
  emailHref: "mailto:info@assaabloy.ge",
};

/** CONTENT.md → Global → footer. The legal line is still a draft. */
export const footer = {
  organisation: "ASSA ABLOY Georgia",
  tagline:
    "წვდომის გადაწყვეტილებების მსოფლიო ლიდერი — მექანიკური და ციფრული უსაფრთხოების ინოვაციური სისტემები სახლებისთვის, ბიზნესისა და ინდუსტრიისთვის.",
  legal: "© 2026 ASSA ABLOY Georgia",
};

/** DERIVED interface strings — not in CONTENT.md; awaiting client review. */
export const ui = {
  menuOpen: "მენიუ",
  menuClose: "დახურვა",
  primaryNavLabel: "მთავარი ნავიგაცია",
  footerNavLabel: "საიტის ნავიგაცია",
  contactLabel: "საკონტაქტო ინფორმაცია",
  skipToContent: "გამოტოვეთ და გადადით მთავარ შინაარსზე",
  /** Text alternative for the ⧉ glyph — the only "leaves the site" signal. */
  opensInNewTab: "იხსნება ახალ ფანჯარაში",
  /** Contact's two column headings. CONTENT.md gives the info-card labels and
   *  the form fields but no heading for either column, and the outline needs a
   *  real h2 — so these two are derived. */
  contactInfoHeading: "საკონტაქტო ინფორმაცია",
  contactFormHeading: "მოგვწერეთ",
};

/**
 * Active-page test for `aria-current="page"`. Trailing slashes are normalised so
 * `/about` and `/about/` both match.
 */
export function isCurrentPath(pathname: string, href: string): boolean {
  const normalise = (p: string) => (p.length > 1 ? p.replace(/\/+$/, "") : p);
  return normalise(pathname) === normalise(href);
}
