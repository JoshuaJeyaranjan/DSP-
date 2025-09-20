import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import '../src/styles/main.scss';

// Main Pages
import HomePage from './Pages/HomePage/HomePage';
import ContactPage from './Pages/ContactPage/ContactPage';
import AboutPage from './Pages/AboutPage/AboutPage';
import ReviewPage from './Pages/ReviewPage/ReviewPage';
import VideoHubPage from './Pages/VideoHubPage/VideoHubPage';
import VideoCategoryPage from './Pages/VideoCategoryPage/VideoCategoryPage';
import PhotoHubPage from './Pages/PhotoHubPage/PhotoHubPage';
import PhotoCategoryPage from './Pages/PhotoCategoryPage/PhotoCategoryPage';
import PricingPage from './Pages/PricingPage/PricingPage';
import PricingCategoryPage from './Pages/PricingCategoryPage/PricingCategoryPage';
import NotFoundPage from './Pages/NotFoundPage/NotFoundPage';

// Admin Pages & Layout
import AdminLayout from './Layouts/AdminLayout/AdminLayout';
import AdminPage from './Pages/AdminPage/AdminPage';
import AdminVideoPage from './Pages/AdminVideoPage/AdminVideoPage';
import AdminReviewsPage from './Pages/AdminReviewsPage/AdminReviewsPage';
import AdminPricingPage from './Pages/AdminPricingPage/AdminPricingPage';
import AdminMiscPage from './Pages/AdminMiscPage/AdminMiscPage';

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Main Pages */}
          <Route path='/' element={<HomePage />} />
          <Route path='/about' element={<AboutPage />} />
          <Route path='/contact' element={<ContactPage />} />
          <Route path='/reviews' element={<ReviewPage />} />

          {/* Video Section */}
          <Route path='/video' element={<VideoHubPage />} />
          <Route path='/video/:category' element={<VideoCategoryPage />} />

          {/* Photography Section */}
          <Route path='/photography' element={<PhotoHubPage />} />
          <Route path='/photography/:category' element={<PhotoCategoryPage />} />

          {/* Pricing Section */}
          <Route path='/packages' element={<PricingPage />} />
          <Route path='/packages/:category' element={<PricingCategoryPage />} />

          {/* Admin Section with nested layout */}
          <Route path='/admin' element={<AdminLayout />}>
            <Route index element={<AdminPage />} /> {/* default dashboard */}
            <Route path='dashboard' element={<AdminPage />} />
            <Route path='videos' element={<AdminVideoPage />} />
            <Route path='reviews' element={<AdminReviewsPage />} />
            <Route path='pricing' element={<AdminPricingPage />} />
            <Route path='misc' element={<AdminMiscPage />} />
          </Route>

          {/* Fallback */}
          <Route path='*' element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;