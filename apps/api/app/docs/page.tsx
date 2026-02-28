"use client";

import dynamic from "next/dynamic";
import "swagger-ui-react/swagger-ui.css";

const SwaggerUI = dynamic(() => import("swagger-ui-react").then((mod) => mod.default), {
  ssr: false,
  loading: () => <p style={{ padding: "2rem" }}>Cargando documentación…</p>,
});

export default function DocsPage() {
  return (
    <div style={{ minHeight: "100vh" }}>
      <SwaggerUI url="/api/openapi" />
    </div>
  );
}
