export interface Product {
  id: string;
  name: string;
  description: string;
  priceInCents: number;
  stock: number;
  imageUrls?: string[];
}

export interface Config {
  baseFeeInCents: number;
  deliveryFeeInCents: number;
}

export interface DeliveryInfo {
  address: string;
  city: string;
  region: string;
  phone: string;
  postalCode: string;
}

export interface CardInfo {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardholderName: string;
}
