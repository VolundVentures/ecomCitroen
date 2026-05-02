// Transparent layout for the /w/[brand] iframe-embed route. Strips the
// global body background so when the widget is in FAB-only mode the iframe's
// empty area is transparent — host page (or iframe styling) shows through.
import type { ReactNode } from "react";

export default function WLayout({ children }: { children: ReactNode }) {
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
        body::before, body::after, html::before, html::after { display: none !important; content: none !important; }
        body > div { background: transparent !important; }
      `}</style>
      {children}
    </>
  );
}
