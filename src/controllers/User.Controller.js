import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validate as isValidEmail } from "email-validator";
import { User } from "../models/userModel.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
export const registerUseer = asyncHandler(async function (req, res) {
    //get details
    // validations
    //check if already exists
    // check for images-image xists avatar
    // upload to cloudinary
    // create user object-entry in mongo
    //remove password RT from response
    //check for user creation

    const { fullname, email, username, password } = req.body
    if (
        [fullname, email, username, password].some((field) =>
            field?.trim() === "")
    ) {
        throw new ApiError(400, 'All Fields are required!')
    }
    if (!isValidEmail(email)) {
        throw new Error('Must be a valid e-mail address')
    }
    const existedUser = await User.findOne(
        { $or: [{ email }, { username }] }
    )
    if (existedUser) {
        throw new ApiError(408, 'User already exists')
    }
    const AvatarFileLocalPath = req.files?.avatar[0]?.path
    const coverImgLocalPath = req.files?.CoverImage[0]?.path
    if (!AvatarFileLocalPath) {
        throw new ApiError(400, 'Avatar Image required')
    }
    const avatar = await uploadOnCloudinary(AvatarFileLocalPath)
    const CoverImage = await uploadOnCloudinary(coverImgLocalPath)

    if (!avatar) {
        throw new ApiError(400, 'Some error occured while uploading file to cloud')
    }
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        CoverImage: CoverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })
    const createdUser = await User.findById(user._id).select('-password -refreshToken')
    if (!createdUser) {
        throw new ApiError(400, 'Something went wrong while registering User')
    }
    return res.status(201).json(
        new ApiResponse(200, createdUser, 'user registered succesfully!')
    )
})