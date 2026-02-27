import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPaymentSuccess, backToModal } from "@/store";
import "./SummaryBackdrop.css";

export function SummaryBackdrop() {
  const dispatch = useDispatch();
  const { selectedProduct, selectedQuantity, config } = useSelector(
    (s: import("@/store").RootState) => s.checkout
  );
  const [loading, setLoading] = useState(false);

  if (!selectedProduct || !config) return null;

  const baseFee = config.baseFeeInCents;
  const deliveryFee = config.deliveryFeeInCents;
  const productAmount = selectedProduct.priceInCents * selectedQuantity;
  const total = productAmount + baseFee + deliveryFee;

  const handlePay = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1200));
    setLoading(false);
    dispatch(setPaymentSuccess(true));
  };

  return (
    <div className="backdrop" role="dialog" aria-modal="true" aria-labelledby="summary-title">
      <div className="backdrop__panel">
        <h2 id="summary-title" className="backdrop__title">Resumen del pago</h2>
        <div className="backdrop__summary">
          <p className="backdrop__line backdrop__product">
            {selectedProduct.name} {selectedQuantity > 1 && `(×${selectedQuantity})`}: <strong>${(productAmount / 100).toLocaleString("es-CO")} COP</strong>
          </p>
          <p className="backdrop__line">Fee base: ${(baseFee / 100).toLocaleString("es-CO")} COP</p>
          <p className="backdrop__line">Envío: ${(deliveryFee / 100).toLocaleString("es-CO")} COP</p>
          <p className="backdrop__total">
            Total: <strong>${(total / 100).toLocaleString("es-CO")} COP</strong>
          </p>
        </div>
        <div className="backdrop__actions">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={() => dispatch(backToModal())}
            disabled={loading}
          >
            Volver
          </button>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handlePay}
            disabled={loading}
          >
            {loading ? "Procesando..." : "Pagar"}
          </button>
        </div>
      </div>
    </div>
  );
}
