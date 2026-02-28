import { useMemo, useState, useEffect } from "react";
import { getTransactionStatus } from "@/api/client";

interface ResultadoPagoPageProps {
  searchString: string;
  onBack: () => void;
}

export function ResultadoPagoPage({ searchString, onBack }: ResultadoPagoPageProps) {
  const params = useMemo(() => new URLSearchParams(searchString), [searchString]);
  const urlStatus = params.get("status")?.toUpperCase() ?? "";
  const urlId = params.get("id");

  const [fetchedStatus, setFetchedStatus] = useState<string | null>(null);
  const [transactionNumber, setTransactionNumber] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!urlId);

  useEffect(() => {
    if (!urlId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await getTransactionStatus(urlId);
        if (cancelled) return;
        if (data) {
          setFetchedStatus(data.status);
          setTransactionNumber(data.transactionNumber);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [urlId]);

  // Estado real: el del backend si lo tenemos; si no, el de la URL del redirect
  const status = fetchedStatus ?? urlStatus;
  const success = status === "APPROVED";
  const displayId = transactionNumber ?? urlId ?? undefined;

  return (
    <div className="app">
      <header className="app__header">
        <h1>Tienda</h1>
      </header>
      <main className="app__main" style={{ maxWidth: "28rem", margin: "2rem auto", textAlign: "center" }}>
        {loading ? (
          <p style={{ marginBottom: "1rem" }}>Verificando estado del pago…</p>
        ) : (
          <>
            <div className={`result__icon ${success ? "result__icon--success" : "result__icon--error"}`} style={{ fontSize: "3rem", marginBottom: "1rem" }}>
              {success ? "✓" : "✕"}
            </div>
            <h2 className="result__title" style={{ marginBottom: "0.5rem" }}>
              {success ? "¡Pago realizado!" : status ? "Pago rechazado o pendiente" : "Resultado del pago"}
            </h2>
            {displayId && <p style={{ color: "var(--gray)", fontSize: "0.9rem" }}>Transacción: {displayId}</p>}
            <p style={{ marginTop: "1rem", marginBottom: "1.5rem" }}>
              {success
                ? "Tu pago se procesó correctamente. El stock se actualizará en breve."
                : "Puedes volver a intentar desde el listado de productos."}
            </p>
          </>
        )}
        <button type="button" className="btn btn--primary" onClick={onBack}>
          Volver a productos
        </button>
      </main>
    </div>
  );
}
