import { redirect } from "next/navigation";

// Contact info now lives in the global footer (every page) instead of a
// dedicated page/section — this route stays only so old links don't 404.
export default function ContactPage() {
  redirect("/#contact-footer");
}
