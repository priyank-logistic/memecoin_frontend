import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

import { API_ROUTER } from "@/routes/apiRouter"

export const buildQueryParams = (params = {}) => {
    const searchParams = new URLSearchParams()

    for (const key in params) {
        if (params[key] !== undefined && params[key] !== null) {
            searchParams.append(key, params[key])
        }
    }

    const queryString = searchParams.toString()

    return queryString ? `?${queryString}` : ""
}

export const apiSlice = createApi({
    reducerPath: "api",
    baseQuery: fetchBaseQuery({
        baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL,
        prepareHeaders: (headers, { getState }) => {
            const token = getState()?.auth?.token

            if (token) {
                headers.set("Authorization", `Bearer ${token}`)
            }

            return headers
        }
    }),
    endpoints: builder => ({
        getProfile: builder.query({
            query: () => API_ROUTER.ADMIN.getProfile
        }),
        login: builder.mutation({
            query: data => ({
                url: API_ROUTER.AUTH.login,
                method: "POST",
                body: data
            })
        }),
        forgotPassword: builder.mutation({
            query: data => ({
                url: API_ROUTER.AUTH.forgotPassword,
                method: "POST",
                body: data
            })
        }),
        updatePassword: builder.mutation({
            query: data => ({
                url: API_ROUTER.AUTH.updatePassword,
                method: "POST",
                body: data
            })
        }),
        updateProfile: builder.mutation({
            query: data => ({
                url: API_ROUTER.ADMIN.updateProfile,
                method: "POST",
                body: data
            })
        }),
        resendOtp: builder.mutation({
            query: data => ({
                url: API_ROUTER.AUTH.resendOtp,
                method: "POST",
                body: data
            })
        }),
        loginWithOtp: builder.mutation({
            query: data => ({
                url: API_ROUTER.AUTH.loginWithOtp,
                method: "POST",
                body: data
            })
        }),
        verifyOtp: builder.mutation({
            query: data => ({
                url: API_ROUTER.AUTH.verifyOtp,
                method: "POST",
                body: data
            })
        }),
        changePassword: builder.mutation({
            query: data => ({
                url: API_ROUTER.ADMIN.changePassword,
                method: "POST",
                body: data
            })
        })
    })
})

export const {
    useGetProfileQuery,
    useLoginMutation,
    useForgotPasswordMutation,
    useUpdatePasswordMutation,
    useUpdateProfileMutation,
    useResendOtpMutation,
    useLoginWithOtpMutation,
    useVerifyOtpMutation,
    useChangePasswordMutation
} = apiSlice
