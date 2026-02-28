import { useMemo, useState, useEffect } from "react";
import { getTransactionStatus } from "@/api/client";

const STORAGE_KEY = "lastPurchasedProductId";

interface ResultadoPagoPageProps {
  searchString: string;
  onBack: (productId?: string) => void;
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

  const status = fetchedStatus ?? urlStatus;
  const success = status === "APPROVED";
  const displayId = transactionNumber ?? urlId ?? undefined;

  const productId = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(STORAGE_KEY) : null;

  const handleBack = () => {
    if (productId) {
      sessionStorage.removeItem(STORAGE_KEY);
      onBack(productId);
    } else {
      onBack();
    }
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>Store</h1>
      </header>
      <main className="app__main result-page__main">
        {loading ? (
          <p className="result-page__loading">Verifying payment status…</p>
        ) : (
          <>
            <div className={`result__icon result__icon--large ${success ? "result__icon--success" : "result__icon--error"}`}>
              {success ? "✓" : "✕"}
            </div>
            <h2 className="result__title">
              {success ? "Payment successful" : status ? "Payment declined or pending" : "Payment result"}
            </h2>
            {displayId && <p className="result-page__transaction">Transaction: {displayId}</p>}
            <p className="result-page__message">
              {success
                ? "Your payment was processed successfully. Your order has been confirmed and stock has been updated."
                : "You can try again from the product page or browse other products."}
            </p>
          </>
        )}
        <button type="button" className="btn btn--primary" onClick={handleBack}>
          {productId ? "Back to product" : "Back to store"}
        </button>
      </main>
    </div>
  );
}
