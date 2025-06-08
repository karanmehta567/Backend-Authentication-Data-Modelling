import dotenv from 'dotenv'
dotenv.config({
    path: './.env'
})
import { User } from "../models/userModel.js";
import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'

export const VerifyJwt = asyncHandler(async function (req, _, next) {
    try {
        const token = req.cookies?.acessToken || req.header("Authorization")?.replace("Bearer ", "")
        console.log('Token', token)
        if (!token) {
            throw new ApiError(401, 'Unauthorized request')
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedToken._id).select('-password -refreshToken')
        if (!user) {
            throw new ApiError(401, 'Invalid Token')
        }
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error.message)
    }
})