import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import HomePage from './Pages/HomePage/HomePage'
import ContactPage from './Pages/ContactPage/ContactPage'
import VideoHubPage from './Pages/VideoHubPage/VideoHubPage'
import AboutPage from './Pages/AboutPage/AboutPage'
import { ThemeProvider } from './context/ThemeContext'
function App() {
  

  return (
    <BrowserRouter>
    <ThemeProvider>
    <Routes>
    <Route path='/' element={<HomePage/>}></Route>
    <Route path='/about' element={<AboutPage/>}></Route>
    <Route path='/contact' element={<ContactPage/>}></Route>
    <Route path='/video' element={<VideoHubPage/>}></Route>
    <Route path='*' element={<HomePage/>}></Route>    
    </Routes>
    </ThemeProvider>
    </BrowserRouter>
  )
}

export default App
