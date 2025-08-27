import React from 'react'
import './HomePage.scss'
import Nav from '../../Components/Nav/Nav'
import { Link } from 'react-router-dom'
import Footer from '../../Components/Footer/Footer';
const HomePage = () => {
    return (
        <>
            <Nav/>
            <div className='home'>
            
            <h1 className='home__title text'>DFS Vision</h1>
            <h3 className='home__subtitle text'>Videographer & Photographer</h3>
            <Link className='home__link' to='/video' > <p>View Work</p> </Link>
            </div>
            <Footer></Footer>
        </>
    )
}

export default HomePage