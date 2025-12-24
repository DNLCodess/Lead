"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

export default function QueryProvider({ children }) {
  const [query] = useState(() => new QueryClient());
  return <QueryClientProvider client={query}>{children}</QueryClientProvider>;
}
