import { configureStore } from '@reduxjs/toolkit';
import connexionInfoReducer from './connexionInfoSlice';

export default configureStore({
    reducer: {
        connexionInfo: connexionInfoReducer,
    },
});