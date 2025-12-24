"use client";

import { useEffect } from "react";
import Script from "next/script";

const FLUTTERWAVE_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;

export function FlutterwavePayment({
  paymentPayload,
  onSuccess,
  onClose,
  onError,
}) {
  const handleScriptLoad = () => {
    console.log("Flutterwave script loaded");
    console.log("Payment payload:", paymentPayload);

    if (typeof window !== "undefined" && window.FlutterwaveCheckout) {
      initializePayment();
    } else {
      console.error("FlutterwaveCheckout not available");
      onError(new Error("Payment gateway failed to load"));
    }
  };

  const initializePayment = () => {
    try {
      // Following Flutterwave Inline V3 Documentation
      window.FlutterwaveCheckout({
        public_key: FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: paymentPayload.tx_ref,
        amount: paymentPayload.amount,
        currency: paymentPayload.currency,
        payment_options: paymentPayload.payment_options,
        redirect_url: paymentPayload.redirect_url,
        customer: paymentPayload.customer,
        customizations: paymentPayload.customizations,
        meta: paymentPayload.meta,
        callback: function (response) {
          console.log("Payment callback response:", response);

          // According to docs, check for successful transaction
          if (
            response.status === "successful" ||
            response.status === "completed"
          ) {
            onSuccess(response);
          } else {
            onError(new Error(`Payment ${response.status}`));
          }
        },
        onclose: function () {
          console.log("Payment modal closed");
          onClose();
        },
      });
    } catch (error) {
      console.error("Error initializing payment:", error);
      onError(error);
    }
  };

  return (
    <Script
      src="https://checkout.flutterwave.com/v3.js"
      strategy="afterInteractive"
      onLoad={handleScriptLoad}
      onError={(e) => {
        console.error("Failed to load Flutterwave script:", e);
        onError(new Error("Failed to load payment gateway"));
      }}
    />
  );
}
