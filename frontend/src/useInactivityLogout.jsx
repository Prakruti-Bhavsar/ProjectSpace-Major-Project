import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const useInactivityLogout = () => {
    const navigate = useNavigate();
    const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 minutes
    let logoutTimer;

    const resetTimer = () => {
        clearTimeout(logoutTimer);
        logoutTimer = setTimeout(() => {
            localStorage.removeItem('Token');
            navigate('/'); // Redirect to homepage
        }, INACTIVITY_LIMIT);
    };

    useEffect(() => {
        const activityEvents = ['click', 'mousemove', 'keypress', 'scroll'];
        activityEvents.forEach(event => window.addEventListener(event, resetTimer));

        resetTimer(); // Initialize the timer on mount

        return () => {
            clearTimeout(logoutTimer);
            activityEvents.forEach(event => window.removeEventListener(event, resetTimer));
        };
    }, []);
};

export default useInactivityLogout;
