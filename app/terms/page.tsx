import type { Metadata } from "next";
import { InfoShell } from "../components/info-shell";
export const metadata: Metadata = { title: "Use of the tool", description: "Practical terms for using MarkdownPic, preserving your source, and checking exported content.", alternates: { canonical: "/terms" } };
export default function Terms() {
  return <InfoShell><h1>Use of the tool</h1><p>MarkdownPic helps you convert your own Markdown into images. You remain responsible for the text, images, and other content you import, create, and share.</p>
    <h2>Your content</h2><p>Use material you own or have permission to use. MarkdownPic does not claim ownership of your writing or exported images. Creating an image does not change copyright, licensing, confidentiality, or other obligations attached to its source material.</p>
    <h2>Check before sharing</h2><p>Review the actual exported file before publishing it. Rendering can depend on browser capabilities, supported syntax, available fonts, and image access. The tool checks for common problems, but it cannot guarantee the correctness or suitability of your content.</p>
    <h2>Keep a backup</h2><p>Draft storage is local to your browser and may be removed by browser settings, storage limits, or device changes. Keep portable project backups for important work. The service is provided as available; availability and browser compatibility can change.</p>
    <h2>Responsible use</h2><p>Do not use the tool to distribute unlawful content, infringe others’ rights, introduce malicious files, or interfere with the service. Third-party websites opened from links or sponsor placements have their own terms.</p>
  </InfoShell>;
}
