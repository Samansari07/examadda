import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "SarkariPrep — Indian Government Exams & Jobs";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "70px",
          background: "linear-gradient(135deg, #081225 0%, #102b55 100%)",
          color: "white",
          fontFamily: "Arial",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            border: "3px solid #4fa8ff",
            borderRadius: "32px",
            padding: "55px",
            height: "100%",
            justifyContent: "center",
            background: "rgba(8, 18, 37, 0.72)",
          }}
        >
          <div style={{ display: "flex", fontSize: 72, fontWeight: 800 }}>
            SarkariPrep
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "18px",
              fontSize: 38,
              color: "#9bd0ff",
              fontWeight: 600,
            }}
          >
            Indian Government Exams & Jobs
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "34px",
              fontSize: 28,
              color: "#e1eafa",
            }}
          >
            Exams  •  Jobs  •  Notifications  •  Preparation
          </div>
          <div
            style={{
              display: "flex",
              marginTop: "48px",
              fontSize: 22,
              color: "#b9c7dc",
            }}
          >
            Official recruitment sources • Student-first information
          </div>
        </div>
      </div>
    ),
    size
  );
}
