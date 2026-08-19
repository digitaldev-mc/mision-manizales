export type CartProduct = {
  id: string;
  name: string;
  priceCOP: number;
  imageUrl: string;
  soldOut: boolean;
  thermometerPercent: number;
};

export type CartLine = {
  productId: string;
  name: string;
  priceCOP: number;
  imageUrl: string;
  quantity: number;
  thermometerPercent: number;
};
