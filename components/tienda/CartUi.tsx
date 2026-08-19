"use client";

import { CartDrawer } from "@/components/tienda/CartDrawer";
import { CartFab } from "@/components/tienda/CartFab";
import { CheckoutModal } from "@/components/tienda/CheckoutModal";
import { ProductPreviewModal } from "@/components/tienda/ProductPreviewModal";

export function CartUi() {
  return (
    <>
      <CartFab />
      <CartDrawer />
      <ProductPreviewModal />
      <CheckoutModal />
    </>
  );
}
