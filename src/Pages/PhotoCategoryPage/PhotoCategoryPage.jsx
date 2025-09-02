import React from 'react'
import { useParams } from 'react-router-dom'
import PhotoGallery from '../../Components/PhotoGallery/PhotoGallery'
import { carsPhotos, portraitsPhotos, dronesPhotos, sportsPhotos } from '../../data/photoData'
import Nav from '../../Components/Nav/Nav'
import Footer from '../../Components/Footer/Footer';
import './PhotoCategoryPage.scss'

const photoMap = {
  cars: carsPhotos,
  portraits: portraitsPhotos,
  drones: dronesPhotos,
  sports: sportsPhotos,
}

// separate display titles
const titleMap = {
  cars: 'Car Photography',
  portraits: 'Portrait Photography',
  drones: 'Drone Photography',
  sports: 'Sports Photography',
}

function PhotoCategoryPage() {
  const { category } = useParams()
  const photos = photoMap[category]
  const title = titleMap[category]

  if (!photos) {
    return <p>Category not found</p>
  }

  return (
    <>
      <Nav />
      <div className="photo-category-page">
        <h1 className="title">{title}</h1>
        <PhotoGallery photos={photos} />
      </div>
      <Footer />
    </>
  )
}

export default PhotoCategoryPage
