export const login = (rememberMe, email) => {

    localStorage.setItem("isLoggedIn","true");

    if(rememberMe){
        localStorage.setItem("userEmail",email.trim());
    }else{
        localStorage.removeItem("userEmail");
    }

};

export const logout = (navigate) => {

    localStorage.removeItem("isLoggedIn");

    navigate("/login",{
        replace:true,
    });

};

export const isAuthenticated = () => {
    return localStorage.getItem("isLoggedIn")==="true";
};