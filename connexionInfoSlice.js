import { createSlice } from '@reduxjs/toolkit';

export const connexionInfoSlice = createSlice({
    name: 'connexionInfo',
    initialState: {
        connexionInfo: []
    },
    reducers: {
        setInfo: (state, action) => {
            state.connexionInfo = { ip: action.payload.ip, port: action.payload.port }
        },
    },
});

export const { setInfo } = connexionInfoSlice.actions;

export const selectItems = (state) => state.connexionInfo.connexionInfo;

export default connexionInfoSlice.reducer;