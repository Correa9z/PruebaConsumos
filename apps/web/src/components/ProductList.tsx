import { useDispatch, useSelector } from "react-redux";
import { openProductDetail } from "@/store";
import type { Product } from "@/types";
import "./ProductList.css";

export function ProductList() {
  const dispatch = useDispatch();
  const products = useSelector((s: import("@/store").RootState) => s.checkout.products);

  const imageUrl = (p: Product) =>
    p.imageUrls?.length ? p.imageUrls[0] : "https://picsum.photos/seed/placeholder/400/300";

  return (
    <section className="product-list">
      <h2 className="product-list__title">Productos</h2>
      <ul className="product-list__grid">
        {products.map((p) => (
          <li key={p.id} className="product-card">
            <button
              type="button"
              className="product-card__image-wrap"
              onClick={() => dispatch(openProductDetail(p))}
              aria-label={`Ver ${p.name}`}
            >
              <img
                src={imageUrl(p)}
                alt=""
                className="product-card__image"
                loading="lazy"
              />
            </button>
            <div className="product-card__content">
              <h3 className="product-card__name">{p.name}</h3>
              <p className="product-card__description">{p.description}</p>
              <p className="product-card__price">
                ${(p.priceInCents / 100).toLocaleString("es-CO")} COP
              </p>
              <p className="product-card__stock">Disponibles: {p.stock}</p>
            </div>
            <div className="product-card__actions">
              <button
                type="button"
                className="product-card__pay"
                onClick={() => dispatch(openProductDetail(p))}
                disabled={p.stock < 1}
              >
                Ver más
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
