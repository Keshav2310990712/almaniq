import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import EventTypes from "./pages/EventTypes";
import BookingsPage from "./pages/BookingsPage";
import AvailabilityPage from "./pages/AvailabilityPage";
import BookingPage from "./pages/BookingPage";
import NotFound from "./pages/NotFound";
import { ThemeProvider } from "@/components/ThemeProvider";
const queryClient = new QueryClient();
const App = () => (<ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<EventTypes />}/>
          <Route path="/bookings" element={<BookingsPage />}/>
          <Route path="/availability" element={<AvailabilityPage />}/>
          <Route path="/book/:slug" element={<BookingPage />}/>
          <Route path="*" element={<NotFound />}/>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  </ThemeProvider>);
export default App;
