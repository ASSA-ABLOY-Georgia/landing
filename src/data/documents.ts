/**
 * The downloadable documents shown in the Products page's documents band.
 *
 * Files live under `public/catalogue/` on kebab-case URLs (PLAN §6.2) — a
 * stable href that needs no percent-encoding, which is why the two door files
 * were renamed off their original spaced/underscored names.
 *
 * Georgian copy: the 2024 catalogue's title and body are CONTENT.md verbatim.
 * The two door documents are DRAFT strings, added to CONTENT.md in the same
 * pass and marked there as awaiting client review.
 */
import type { ImageMetadata } from "astro";
import catalogueCover from "../assets/catalogue-cover.jpg";
import presentationCover from "../assets/catalogue-presentation-cover.jpg";
import technicalCover from "../assets/catalogue-technical-cover.jpg";

export interface SiteDocument {
  title: string;
  body: string;
  /** Same-origin path under `public/catalogue/`. */
  href: string;
  /** Page 1 (PDF) or slide 1 (PPTX), rendered ahead of time per PLAN §5. */
  cover: ImageMetadata;
  /** Meta line, rendered as `format · language? · extent · size`. */
  format: string;
  /**
   * Set only when the file is NOT in Georgian. On a `lang="ka"` site Georgian is
   * the default expectation, so the informative signal is the exception — an
   * English document says so before the visitor spends 7 MB finding out.
   */
  language?: string;
  /**
   * PDF pages as the reader will count them. The technical catalogue numbers its
   * own pages to 86 because pages 2–45 are A3 two-up spreads; „45" is what the
   * file has and what any PDF viewer's page counter will show, so „86" would
   * contradict the artefact in the visitor's hands (DECISIONS D8.6).
   */
  extent: string;
  /** Measured in MiB, matching the „~24 MB" label the 2024 catalogue already had. */
  size: string;
  /**
   * True when a browser renders the file inline. PDFs do; a .pptx only ever
   * downloads, so giving it a „ნახვა" button would promise a preview that no
   * browser actually delivers — it gets „გადმოწერა" alone.
   */
  viewable: boolean;
}

export const documents: SiteDocument[] = [
  {
    title: "პროდუქტების კატალოგი 2024",
    body: "ჩამოტვირთეთ ან დაათვალიერეთ ASSA ABLOY-ის პროდუქტების სრული კატალოგი — დეტალური ინფორმაცია სერიების, სპეციფიკაციებისა და გამოყენების სფეროების შესახებ.",
    href: "/catalogue/assa-abloy-catalogue-2024.pdf",
    cover: catalogueCover,
    format: "PDF",
    extent: "275 გვერდი",
    size: "~24 MB",
    viewable: true,
  },
  {
    title: "მეტალისა და ხის კარების ტექნიკური კატალოგი",
    body: "სერიები, ზომები, მასალები და მონტაჟის სპეციფიკაციები — ტექნიკური დოკუმენტაცია პროექტირებისა და შერჩევისთვის.",
    href: "/catalogue/assa-abloy-doors-technical-catalog.pdf",
    cover: technicalCover,
    format: "PDF",
    language: "ინგლისურად",
    extent: "45 გვერდი",
    size: "~7 MB",
    viewable: true,
  },
  {
    title: "კარების კატალოგი",
    body: "კონსტრუქცია, ზომები, ზედაპირის დამუშავება და ჩაკეტვის სისტემები — ტექნიკური მიმოხილვა.",
    href: "/catalogue/assa-abloy-doors-presentation.pptx",
    cover: presentationCover,
    format: "PPTX",
    language: "ინგლისურად",
    extent: "10 სლაიდი",
    size: "~3.4 MB",
    viewable: false,
  },
];
