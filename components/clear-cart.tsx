"use client";

import { useEffect } from "react";

export function ClearCart() {
  useEffect(() => {
    window.localStorage.removeItem("pulsetap_cart");
  }, []);

  return null;
}
