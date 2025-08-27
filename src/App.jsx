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

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          {/* Main Pages */}
          <Route path='/' element={<HomePage />} />
          <Route path='/about' element={<AboutPage />} />
          <Route path='/contact' element={<ContactPage />} />

          {/* Video Section */}
          <Route path='/video' element={<VideoHubPage />} />
          <Route path='/video/:category' element={<VideoCategoryPage />} />

          {/* Photography Section */}
          <Route path='/photography' element={<PhotoHubPage />} />
          <Route path='/photography/:category' element={<PhotoCategoryPage />} />

          {/* Fallback */}
          <Route path='*' element={<HomePage />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App