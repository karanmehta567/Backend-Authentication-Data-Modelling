import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

export const DB_CONNECT = async () => {
    try {
        await mongoose.connect(`${process.env.MONGO_DB_URI}/${DB_NAME}`)
        console.log('MongoDB Connected!!!!!!')
    } catch (error) {
        console.log('error', error)
    }
}