import dotenv from 'dotenv';
dotenv.config({
    path: './.env'
});
import { v2 as cloudinary } from 'cloudinary'
import { ApiError } from './apiError';
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});
export const deleteAvatar = async function (publicId) {
    try {
        if (!publicId) {
            return null;
        }
        //delete
        const response = await cloudinary.uploader.destroy(publicId)
        console.log('response while deleting', response)
        return response;
    } catch (error) {
        throw new ApiError(500, 'Some error occured while deleting on cloud,try again!!!!')
    }
}