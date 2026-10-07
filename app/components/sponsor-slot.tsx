import { sponsorship } from "@/lib/site-config";

export function SponsorSlot({ placement }: { placement: "help-bottom" }) {
  if (!sponsorship.enabled || !sponsorship.placements.includes(placement) || !sponsorship.title || !/^https:\/\//.test(sponsorship.url)) return null;
  return <aside className="sponsor-slot" aria-label="Sponsored placement"><span>{sponsorship.label}</span><a href={sponsorship.url} rel="sponsored noopener noreferrer" target="_blank">{sponsorship.title}</a></aside>;
}
