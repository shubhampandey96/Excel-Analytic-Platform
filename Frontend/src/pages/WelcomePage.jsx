import React from 'react'
import { useNavigate } from 'react-router-dom';

const WelcomePage = () => {
    const navigate = useNavigate();
    return (
        <div className='flex flex-col justify-center items-center min-h-screen bg-gradient-to-br from-blue-500 to-indigo-700 text-white p-4'>
            <div className='text-center bg-white/20 backdrop-blur-lg rounded-xl mb-1 p-8 md:p-12 max-w-lg w-full transform transition-all duration-500 ease-in-out scale-95 hover:scale-100'>
                <h1 className='text-4xl md:text-5xl font-extrabold mb-4'>Welcome to <span className='text-yellow-300'>Excel Analytics</span></h1>
                <p className='text-lg md:text-xl mb-8 opacity-90 animate-pulse'>Your powerful platform for data analysis and visualization.</p>
                <div className='flex flex-col sm:flex-row justify-center gap-4'>
                    <button className='bg-white text-blue-700 font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-blue-100 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-400' onClick={() => navigate('/login')}>Login</button>
                    <button className='border-2 border-white text-white font-semibold py-3 px-8 rounded-full shadow-lg hover:bg-white/20 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white' onClick={() => navigate('/register')}>Register</button>
                </div>
            </div>
            <div className='text-center mt-4'>
                <p className=' text-white text-sm opacity-80'>
                    This Project was Created by <span className='text-yellow-300'>Shubham Pandey</span><span className='text-yellow-300'></span>.
                </p>
            </div>
            <footer className='mt-12 text-white text-sm opacity-80'>
                &copy; {new Date().getFullYear()} Excel Analytics Platform. All rights reserved.
            </footer>
        </div>
    )
}

export default WelcomePage;