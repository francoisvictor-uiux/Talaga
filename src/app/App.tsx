import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ThemeProvider } from "./context/ThemeContext";
import { DbProvider } from "./context/DbContext";

export default function App() {
  return (
    <ThemeProvider>
      <DbProvider>
        <RouterProvider router={router} />
      </DbProvider>
    </ThemeProvider>
  );
}
