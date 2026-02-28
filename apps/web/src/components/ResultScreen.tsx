import { useDispatch, useSelector } from "react-redux";
import { goToProducts, setProducts } from "@/store";
import { getProducts } from "@/api/client";
import "./ResultScreen.css";

export function ResultScreen() {
  const dispatch = useDispatch();
  const { paymentSuccess, paymentError } = useSelector(
    (s: import("@/store").RootState) => s.checkout
  );

  const success = paymentSuccess === true;

  const handleBack = async () => {
    try {
      const list = await getProducts();
      dispatch(setProducts(list));
    } finally {
      dispatch(goToProducts());
    }
  };

  return (
    <div className="result-overlay" role="dialog" aria-modal="true" aria-labelledby="result-title">
      <div className="result">
        <div className={`result__icon ${success ? "result__icon--success" : "result__icon--error"}`}>
          {success ? "✓" : "✕"}
        </div>
        <h2 id="result-title" className="result__title">
          {paymentError ? "Error en el pago" : success ? "¡Pago realizado!" : "Pago rechazado"}
        </h2>
        {paymentError && (
          <p className="result__message result__message--error">{paymentError}</p>
        )}
        {success && !paymentError && (
          <p className="result__message">
            Tu transacción se procesó correctamente. Recibirás un correo de confirmación.
          </p>
        )}
        <button
          type="button"
          className="btn btn--primary result__btn"
          onClick={handleBack}
        >
          Volver a productos
        </button>
      </div>
    </div>
  );
}
