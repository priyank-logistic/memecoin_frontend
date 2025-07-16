import { configureStore } from "@reduxjs/toolkit"
import { persistStore, persistReducer } from "redux-persist"

import createWebStorage from "redux-persist/lib/storage/createWebStorage"

import { authReducer } from "@libs/features/reducer/slices/authSlice"
import { apiSlice } from "@libs/features/api/slices/apiSlice"
import { inquirySlice } from "@libs/features/api/slices/inquirySlice"

const createNoopStorage = () => {
    return {
        getItem() {
            return Promise.resolve(null)
        },
        setItem(key, value) {
            return Promise.resolve(value)
        },
        removeItem() {
            return Promise.resolve()
        }
    }
}

const storage = typeof window !== "undefined" ? createWebStorage("local") : createNoopStorage()

// Persist Config
const persistConfig = {
    key: "auth",
    storage
}

// Create persisted reducer
const persistedReducer = persistReducer(persistConfig, authReducer)

export const store = configureStore({
    reducer: {
        auth: persistedReducer,
        [apiSlice.reducerPath]: apiSlice.reducer,
        [inquirySlice.reducerPath]: inquirySlice.reducer
    },
    middleware: getDefaultMiddleware =>
        getDefaultMiddleware({
            serializableCheck: false
        }).concat(apiSlice.middleware, inquirySlice.middleware)
})

// Ensure persistor runs only on the client
export let persistor = null

if (typeof window !== "undefined") {
    persistor = persistStore(store)
}
