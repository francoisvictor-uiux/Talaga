import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ThemeProvider } from "./context/ThemeContext";
import { DbProvider } from "./context/DbContext";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DbProvider>
          <RouterProvider router={router} />
          <Toaster position="top-left" richColors dir="rtl" />
        </DbProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
