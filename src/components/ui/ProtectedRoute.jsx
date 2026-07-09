import React from "react";
import {Navigate} from "react-router-dom";

const ProtectedRoute = ({ children }) => {
    const isLoggedIn = 
        localStorage.getItem("isLoggedIn") === "true";

    if (!isLoggedIn) {
        return (
            <Navigate
                tp="/login"
                replace
            />
        );
    }
    
    return children;
};

export default ProtectedRoute;