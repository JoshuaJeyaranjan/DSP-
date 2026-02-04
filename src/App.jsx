import "./App.css";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import "../src/styles/main.scss";

import HomePage from "./Pages/HomePage/HomePage";
import ContactPage from "./Pages/ContactPage/ContactPage";
import AboutPage from "./Pages/AboutPage/AboutPage";
import ReviewPage from "./Pages/ReviewPage/ReviewPage";
import VideoHubPage from "./Pages/VideoHubPage/VideoHubPage";
import VideoCategoryPage from "./Pages/VideoCategoryPage/VideoCategoryPage";
import PhotoHubPage from "./Pages/PhotoHubPage/PhotoHubPage";
import PhotoCategoryPage from "./Pages/PhotoCategoryPage/PhotoCategoryPage";
import PricingPage from "./Pages/PricingPage/PricingPage";
import PricingCategoryPage from "./Pages/PricingCategoryPage/PricingCategoryPage";
import NotFoundPage from "./Pages/NotFoundPage/NotFoundPage";

import AdminLayout from "./Layouts/AdminLayout/AdminLayout";
import AdminPage from "./Pages/AdminPage/AdminPage";
import AdminVideoPage from "./Pages/AdminVideoPage/AdminVideoPage";
import AdminReviewsPage from "./Pages/AdminReviewsPage/AdminReviewsPage";
import AdminPricingPage from "./Pages/AdminPricingPage/AdminPricingPage";
import AdminMiscPage from "./Pages/AdminMiscPage/AdminMiscPage";
import LoginPage from "./Pages/LoginPage/LoginPage";
import AdminPhotoCategoriesPage from "./Pages/AdminPhotoCategoriesPage/AdminPhotoCategoriesPage";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/reviews" element={<ReviewPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route path="/video" element={<VideoHubPage />} />
          <Route path="/video/:category" element={<VideoCategoryPage />} />

          <Route path="/photography" element={<PhotoHubPage />} />
          <Route
            path="/photography/:category"
            element={<PhotoCategoryPage />}
          />

          <Route path="/packages" element={<PricingPage />} />
          <Route path="/packages/:category" element={<PricingCategoryPage />} />

          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminPage />} />
            <Route path="dashboard" element={<AdminPage />} />
            <Route path="videos" element={<AdminVideoPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
            <Route path="pricing" element={<AdminPricingPage />} />
            <Route path="misc" element={<AdminMiscPage />} />
            <Route
              path="photo-categories"
              element={<AdminPhotoCategoriesPage />}
            />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
