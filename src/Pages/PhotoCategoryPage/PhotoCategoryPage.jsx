import React from 'react'
import { useParams } from 'react-router-dom'
import PhotoGallery from '../../Components/PhotoGallery/PhotoGallery'
import { carsPhotos, portraitsPhotos, dronesPhotos } from '../../data/photoData'
import Nav from '../../Components/Nav/Nav'
const photoMap = {
  cars: carsPhotos,
  portraits: portraitsPhotos,
  drones: dronesPhotos,
}

function PhotoCategoryPage() {
  const { category } = useParams()
  const photos = photoMap[category]

  if (!photos) {
    return <p>Category not found</p>
  }

  return (
    <>
    <Nav></Nav>
    <div className="photo-category-page">
      <h1>{category.charAt(0).toUpperCase() + category.slice(1)}</h1>
      <PhotoGallery photos={photos} />
    </div>
    </>
  )
}

export default PhotoCategoryPage