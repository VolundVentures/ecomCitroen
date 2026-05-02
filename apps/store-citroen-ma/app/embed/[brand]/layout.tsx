// Transparent layout for the iframe-embed route. Overrides the global body
// background so the parent page shows through behind the FAB and chat panel.
import type { ReactNode } from "react";

export default function EmbedLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <style>{`
        html, body {
          background: transparent !important;
          background-image: none !important;
          background-color: transparent !important;
          min-height: 0 !important;
          margin: 0 !important;
          padding: 0 !important;
          overflow: hidden !important;
          color-scheme: normal !important;
        }
        /* Strip the textured noise overlays globals.css adds via ::before / ::after */
        body::before, body::after, html::before, html::after { display: none !important; content: none !important; }
        /* Belt-and-braces: any first-level wrapper from Next shouldn't fill or paint. */
        body > div { background: transparent !important; }
      `}</style>
      {children}
    </>
  );
}
