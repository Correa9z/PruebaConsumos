import { useDispatch, useSelector } from "react-redux";
import { goToProducts } from "@/store";
import "./ResultScreen.css";

export function ResultScreen() {
  const dispatch = useDispatch();
  const { paymentSuccess, paymentError } = useSelector(
    (s: import("@/store").RootState) => s.checkout
  );

  const success = paymentSuccess === true;

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
          onClick={() => dispatch(goToProducts())}
        >
          Volver a productos
        </button>
      </div>
    </div>
  );
}
