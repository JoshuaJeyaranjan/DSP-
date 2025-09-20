import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomePage from './Pages/HomePage/HomePage'
import ContactPage from './Pages/ContactPage/ContactPage'
import VideoHubPage from './Pages/VideoHubPage/VideoHubPage'
import PhotoHubPage from './Pages/PhotoHubPage/PhotoHubPage'
import AboutPage from './Pages/AboutPage/AboutPage'
import PhotoCategoryPage from './Pages/PhotoCategoryPage/PhotoCategoryPage'
import VideoCategoryPage from './Pages/VideoCategoryPage/VideoCategoryPage'
import { ThemeProvider } from './context/ThemeContext'
import '../src/styles/main.scss'
import ReviewPage from './Pages/ReviewPage/ReviewPage'
import AdminPage from './Pages/AdminPage/AdminPage'
import AdminVideoPage from './Pages/AdminVideoPage/AdminVideoPage'
import NotFoundPage from './Pages/NotFoundPage/NotFoundPage'
import AdminReviewsPage from './Pages/AdminReviewsPage/AdminReviewsPage'
import AdminMiscPage from './Pages/AdminMiscPage/AdminMiscPage'
import PricingPage from './Pages/PricingPage/PricingPage'
import PricingCategoryPage from './Pages/PricingCategoryPage/PricingCategoryPage'
import AdminPricingPage from './Pages/AdminPricingPage/AdminPricingPage'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Main Pages */}
          <Route path='/' element={<HomePage />} />
          <Route path='/admin' element={<AdminPage />} />
          <Route path='/admin-video' element={<AdminVideoPage />} />
          <Route path='/admin-review' element={<AdminReviewsPage />} />
          <Route path='/admin-pricing' element={<AdminPricingPage />} />
          <Route path='/admin-misc' element={<AdminMiscPage />} />
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
          {/* Fallback */}
          <Route path='*' element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App