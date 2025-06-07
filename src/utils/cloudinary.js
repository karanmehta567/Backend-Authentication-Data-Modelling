import dotenv from 'dotenv';
dotenv.config({
    path: './.env'
});
import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
export const uploadOnCloudinary = async function (localFilePath) {
    try {
        if (!localFilePath) {
            return null;
        }
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })
        console.log('File upload Sucess', response.format, response.url)
        fs.unlinkSync(localFilePath)
        return response;
    } catch (error) {
        console.log('Error on Cloud', error)
        fs.unlinkSync(localFilePath) //remove file please locally saved path
        return null;
    }
}