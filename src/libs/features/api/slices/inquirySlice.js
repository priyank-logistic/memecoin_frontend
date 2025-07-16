import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

import { buildQueryParams } from "./apiSlice"
import { API_ROUTER } from "@/routes/apiRouter"

export const inquirySlice = createApi({
    reducerPath: "inquiryApi",
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
        getInquiry: builder.query({
            query: data => {
                const queryParams = buildQueryParams(data?.params)

                return `${API_ROUTER.ADMIN.getInquiry}${queryParams}`
            }
        }),
        getVehicleList: builder.query({
            query: params => {
                const queryParams = buildQueryParams(params)

                return `${API_ROUTER.ADMIN.getVehicleList}${queryParams}`
            }
        })
    })
})

export const { useLazyGetInquiryQuery, useGetVehicleListQuery } = inquirySlice
