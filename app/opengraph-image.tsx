import { ImageResponse } from "next/og";

// Generated rather than a static file so it can never drift from the brand
// colours, and so there is nothing to re-export when the wordmark changes.
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "ChatFlowGate - the secure chat frontend for n8n workflows";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "#010717",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2 4 5.5v6c0 4.5 3.4 8.7 8 9.5 4.6-.8 8-5 8-9.5v-6L12 2z" />
          </svg>
          <div style={{ display: "flex", fontSize: 76, fontWeight: 700, letterSpacing: "-0.02em" }}>
            <span style={{ color: "#ffffff" }}>Flow</span>
            <span style={{ color: "#1f6feb" }}>Gate</span>
          </div>
        </div>
        <div style={{ marginTop: 40, fontSize: 40, lineHeight: 1.25, color: "#c9d4e5", maxWidth: 900 }}>
          The secure, branded chat frontend for n8n workflows
        </div>
        <div style={{ marginTop: 28, fontSize: 26, color: "#7d8ba1" }}>
          Hidden webhooks - rate limiting - signed sessions - chatflowgate.com
        </div>
      </div>
    ),
    size,
  );
}