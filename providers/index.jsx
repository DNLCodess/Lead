import QueryProvider from "./QueryProvider";
import { ThemeProvider } from "./ThemeProvider";

export default function Providers({ children }) {
  return (
    <ThemeProvider>
      <QueryProvider>{children}</QueryProvider>
    </ThemeProvider>
  );
}
