"use client"

import { useEffect } from "react"

import { useRouter } from "next/navigation"

import { useDispatch, useSelector, Provider } from "react-redux"

import { PersistGate } from "redux-persist/integration/react"

import { useSession } from "next-auth/react"

import { setProfile, setUser } from "@libs/features/reducer/slices/authSlice"
import { useGetProfileQuery } from "@libs/features/api/slices/apiSlice"

import { store, persistor } from "@libs/store"

const AuthProvider = ({ children }) => {
    const dispatch = useDispatch()
    const router = useRouter()

    // const token = useSelector(state => state.auth.token)

    // const { data: userData, isSuccess } = useGetProfileQuery(undefined, {
    //     skip: !token
    // })

    // useEffect(() => {
    //     if (isSuccess && userData) {
    //         dispatch(setProfile(userData.user))
    //     }
    // }, [userData, isSuccess, dispatch])

    const { data: session, status } = useSession()
    const token = session?.access_token
    
    useEffect(() => {
        if (token) {
            dispatch(setUser({ token }))
        }
    }, [token, dispatch])

    return <>{children}</>
}

const ReduxProvider = ({ children }) => (
    <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
            <AuthProvider>{children}</AuthProvider>
        </PersistGate>
    </Provider>
)

export default ReduxProvider
