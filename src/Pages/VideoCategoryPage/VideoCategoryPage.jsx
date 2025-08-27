import React from 'react'
import { useParams } from 'react-router-dom'
import VideoGallery from '../../Components/VideoGallery/VideoGallery'
import { landscapeVideos, droneVideos, shortVideos } from '../../data/videoData'
import Nav from '../../Components/Nav/Nav'
import Footer from '../../Components/Footer/Footer';
const videoMap = {
  landscape: landscapeVideos,
  drone: droneVideos,
  shorts: shortVideos,
}

function VideoCategoryPage() {
  const { category } = useParams()
  const videos = videoMap[category]

  if (!videos) {
    return <p>Category not found</p>
  }

  return (
    <>
    <Nav></Nav>
    <div className="video-category-page">
      <h1>{category.charAt(0).toUpperCase() + category.slice(1)} Videos</h1>
      <VideoGallery videos={videos} />
    </div>
    <Footer></Footer>
    </>
  )
}

export default VideoCategoryPage