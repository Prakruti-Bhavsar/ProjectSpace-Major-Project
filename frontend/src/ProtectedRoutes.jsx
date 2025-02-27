import {Outlet, Navigate} from 'react-router-dom'

const ProtectedRoutes = () => {
    const token = localStorage.getItem('Token')

    return(

        token ? <Outlet/> : <Navigate to="/" />
    )

}

export default ProtectedRoutes