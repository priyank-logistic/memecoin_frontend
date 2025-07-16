import { createSlice } from "@reduxjs/toolkit"

const initialState = {
    token: "",
    user: null,
    loading: false
}

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.token = action.payload.token
            state.loading = false
        },
        setProfile: (state, action) => {
            state.user = action.payload
        },
        clearUser: state => {
            state.token = ""
            state.user = null
        }
    }
})

export const { setUser, clearUser, setProfile } = authSlice.actions

export const authReducer = authSlice.reducer

export const authState = (state) => state.auth;

