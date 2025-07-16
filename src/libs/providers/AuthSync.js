"use client"

import { useEffect } from "react"

import { useDispatch } from "react-redux"

import { setUser, clearUser } from "@libs/features/reducer/slices/authSlice"

const AuthSync = () => {
    const dispatch = useDispatch()

    useEffect(() => {
        const handleStorageChange = event => {
            if (event.key === "authState") {
                const newState = JSON.parse(event.newValue)

                if (newState) {
                    dispatch(setUser(newState))
                }
            }

            if (event.key === "logout") {
                dispatch(clearUser())
            }
        }

        window.addEventListener("storage", handleStorageChange)

        return () => {
            window.removeEventListener("storage", handleStorageChange)
        }
    }, [dispatch])

    return null
}

export default AuthSync
