const subRoute = (root, sub) => `${root}${sub}`

const PUBLIC = "/public/api/v1/admin"
const ADMIN = "/api/v1/admin"

export const API_ROUTER = {
    AUTH: {
        login: subRoute(PUBLIC, "/main-login"),
        forgotPassword: subRoute(PUBLIC, "/forgot-password"),
        updatePassword: subRoute(PUBLIC, "/update-password"),
        resendOtp: subRoute(PUBLIC, "/resend-otp"),
        loginWithOtp: subRoute(PUBLIC, "/login-with-otp"),
        verifyOtp: "credentials-otp"
    },
    ADMIN: {
        // Profile
        getProfile: subRoute(ADMIN, "/get-profile"),
        updateProfile: subRoute(ADMIN, "/update-profile"),
        changePassword: subRoute(ADMIN, "/change-password"),

        // Inquiry
        getInquiry: subRoute(ADMIN, "/inquiry/list"),

        // Fleet-Vehicle
        getVehicleList: subRoute(ADMIN, "/vehicle-list/list")
    }
}
