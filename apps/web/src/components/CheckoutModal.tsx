import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  closeModal,
  confirmCardAndDelivery,
  setCard,
  setDelivery,
  setCustomer,
  setWompiAcceptance,
} from "@/store";
import { getWompiMerchant } from "@/api/client";
import {
  luhnCheck,
  detectCardType,
  formatCardNumber,
  formatExpiry,
  formatCvc,
} from "@/utils/cardValidation";
import "./CheckoutModal.css";

export function CheckoutModal() {
  const dispatch = useDispatch();
  const { card, delivery, customerEmail, customerFullName } = useSelector(
    (s: import("@/store").RootState) => s.checkout
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [acceptedPolicy, setAcceptedPolicy] = useState(false);
  const [acceptedPersonalData, setAcceptedPersonalData] = useState(false);
  const [merchantLoading, setMerchantLoading] = useState(true);
  const [merchantError, setMerchantError] = useState<string | null>(null);
  const [permalinkPolicy, setPermalinkPolicy] = useState<string | null>(null);
  const [permalinkPersonalData, setPermalinkPersonalData] = useState<string | null>(null);
  const cardType = detectCardType(card.number);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setMerchantLoading(true);
      setMerchantError(null);
      try {
        const data = await getWompiMerchant();
        if (cancelled) return;
        if (data.acceptanceToken && data.acceptPersonalAuth) {
          dispatch(
            setWompiAcceptance({
              acceptanceToken: data.acceptanceToken,
              acceptPersonalAuth: data.acceptPersonalAuth,
            })
          );
          setPermalinkPolicy(data.permalinkPolicy ?? null);
          setPermalinkPersonalData(data.permalinkPersonalData ?? null);
        } else {
          dispatch(setWompiAcceptance(null));
        }
      } catch (e) {
        if (!cancelled) {
          setMerchantError(e instanceof Error ? e.message : "Failed to load acceptance terms");
          dispatch(setWompiAcceptance(null));
        }
      } finally {
        if (!cancelled) setMerchantLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [dispatch]);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    // Tarjeta (datos falsos pero estructura válida según enunciado)
    if (!card.number.trim()) e.cardNumber = "Card number required";
    else if (!luhnCheck(card.number)) e.cardNumber = "Invalid card number";
    if (!card.cvc.trim()) e.cvc = "CVC required";
    else if (card.cvc.length < 3) e.cvc = "Invalid CVC";
    if (!card.expMonth || !card.expYear) e.exp = "Expiry date required";
    else if (card.expMonth.length !== 2 || card.expYear.length !== 2) e.exp = "Format MM/YY";
    if (!card.cardholderName.trim()) e.name = "Cardholder name required";
    if (!customerEmail.trim()) e.email = "Email required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) e.email = "Invalid email";
    if (!customerFullName.trim()) e.fullName = "Full name required";
    if (!delivery.address.trim()) e.address = "Address required";
    if (!delivery.city.trim()) e.city = "City required";
    if (!delivery.phone.trim()) e.phone = "Phone required";
    if (permalinkPolicy && !acceptedPolicy) e.acceptPolicy = "You must accept the terms and conditions";
    if (permalinkPersonalData && !acceptedPersonalData) e.acceptPersonal = "You must accept the personal data policy";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    dispatch(setCustomer({ email: customerEmail, fullName: customerFullName }));
    dispatch(confirmCardAndDelivery());
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal">
        <div className="modal__header">
          <h2 id="modal-title">Payment and delivery</h2>
          <button
            type="button"
            className="modal__close"
            onClick={() => dispatch(closeModal())}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="modal__form">
          <fieldset className="modal__section">
            <legend>Card</legend>
            {merchantError && (
              <p className="form-error modal__merchant-error">
                {merchantError}. Terms unavailable; you may continue without acceptance.
              </p>
            )}
            {merchantLoading && <p className="modal__loading">Loading payment gateway…</p>}
            <div className="modal__card-logos">
              <span className={`card-logo card-logo--visa ${cardType === "visa" ? "card-logo--active" : ""}`}>VISA</span>
              <span className={`card-logo card-logo--mc ${cardType === "mastercard" ? "card-logo--active" : ""}`}>Mastercard</span>
            </div>
            <label>
              Card number
              <input
                type="text"
                inputMode="numeric"
                placeholder="0000 0000 0000 0000"
                value={card.number}
                onChange={(e) => dispatch(setCard({ number: formatCardNumber(e.target.value) }))}
                className={errors.cardNumber ? "input--error" : ""}
              />
              {errors.cardNumber && <span className="form-error">{errors.cardNumber}</span>}
            </label>
            <div className="modal__row">
              <label>
                Expiry (MM/YY)
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="MM/AA"
                  autoComplete="cc-exp"
                  value={
                    card.expMonth.length === 2
                      ? `${card.expMonth}/${card.expYear}`
                      : card.expMonth
                  }
                  onChange={(e) => {
                    const f = formatExpiry(e.target.value);
                    const [mm, yy] = f.split("/");
                    dispatch(setCard({ expMonth: mm ?? "", expYear: yy ?? "" }));
                  }}
                  className={errors.exp ? "input--error" : ""}
                />
                {errors.exp && <span className="form-error">{errors.exp}</span>}
              </label>
              <label>
                CVC
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="123"
                  value={card.cvc}
                  onChange={(e) => dispatch(setCard({ cvc: formatCvc(e.target.value) }))}
                  className={errors.cvc ? "input--error" : ""}
                />
                {errors.cvc && <span className="form-error">{errors.cvc}</span>}
              </label>
            </div>
            <label>
              Cardholder name
              <input
                type="text"
                placeholder="As shown on card"
                value={card.cardholderName}
                onChange={(e) => dispatch(setCard({ cardholderName: e.target.value }))}
                className={errors.name ? "input--error" : ""}
              />
              {errors.name && <span className="form-error">{errors.name}</span>}
            </label>
            {(permalinkPolicy || permalinkPersonalData) && (
              <div className="modal__acceptance">
                {permalinkPolicy && (
                  <label className="modal__checkbox">
                    <input
                      type="checkbox"
                      checked={acceptedPolicy}
                      onChange={(e) => setAcceptedPolicy(e.target.checked)}
                    />
                    <span>
                      I accept the{" "}
                      <a href={permalinkPolicy} target="_blank" rel="noopener noreferrer">
                        terms and conditions
                      </a>
                    </span>
                  </label>
                )}
                {permalinkPersonalData && (
                  <label className="modal__checkbox">
                    <input
                      type="checkbox"
                      checked={acceptedPersonalData}
                      onChange={(e) => setAcceptedPersonalData(e.target.checked)}
                    />
                    <span>
                      I accept the{" "}
                      <a href={permalinkPersonalData} target="_blank" rel="noopener noreferrer">
                        personal data policy
                      </a>
                    </span>
                  </label>
                )}
                {errors.acceptPolicy && <span className="form-error">{errors.acceptPolicy}</span>}
                {errors.acceptPersonal && <span className="form-error">{errors.acceptPersonal}</span>}
              </div>
            )}
          </fieldset>
          <fieldset className="modal__section">
            <legend>Delivery</legend>
            <p className="modal__hint">Payment will be completed on the secure payment page after the summary.</p>
            <label>
              Email
              <input
                type="email"
                placeholder="you@email.com"
                value={customerEmail}
                onChange={(e) => dispatch(setCustomer({ email: e.target.value, fullName: customerFullName }))}
                className={errors.email ? "input--error" : ""}
              />
              {errors.email && <span className="form-error">{errors.email}</span>}
            </label>
            <label>
              Full name
              <input
                type="text"
                placeholder="Full name"
                value={customerFullName}
                onChange={(e) => dispatch(setCustomer({ email: customerEmail, fullName: e.target.value }))}
                className={errors.fullName ? "input--error" : ""}
              />
              {errors.fullName && <span className="form-error">{errors.fullName}</span>}
            </label>
            <label>
              Address
              <input
                type="text"
                placeholder="Street, number"
                value={delivery.address}
                onChange={(e) => dispatch(setDelivery({ address: e.target.value }))}
                className={errors.address ? "input--error" : ""}
              />
              {errors.address && <span className="form-error">{errors.address}</span>}
            </label>
            <div className="modal__row">
              <label>
                City
                <input
                  type="text"
                  placeholder="City"
                  value={delivery.city}
                  onChange={(e) => dispatch(setDelivery({ city: e.target.value }))}
                  className={errors.city ? "input--error" : ""}
                />
                {errors.city && <span className="form-error">{errors.city}</span>}
              </label>
              <label>
                Phone
                <input
                  type="tel"
                  placeholder="Phone"
                  value={delivery.phone}
                  onChange={(e) => dispatch(setDelivery({ phone: e.target.value }))}
                  className={errors.phone ? "input--error" : ""}
                />
                {errors.phone && <span className="form-error">{errors.phone}</span>}
              </label>
            </div>
          </fieldset>
          <div className="modal__actions">
            <button type="button" className="btn btn--secondary" onClick={() => dispatch(closeModal())}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={merchantLoading}>
              {merchantLoading ? "Loading…" : "Continue to summary"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
