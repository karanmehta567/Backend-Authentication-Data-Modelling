import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validate as isValidEmail } from "email-validator";
import { User } from "../models/userModel.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from 'jsonwebtoken'
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
    let coverImgLocalPath;
    if (req.files && Array.isArray(req.files.CoverImage) && req.files.CoverImage.length > 0) {
        coverImgLocalPath = req.files.CoverImage[0].path
    }
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
const GenerateAcessandRefreshToken = async function (userId) {
    try {
        const user = await User.findById(userId)
        const acessToken = await user.GenerateAcessToken()
        const refreshToken = await user.GenerateRefreshToken()
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false })
        return { acessToken, refreshToken }
    } catch (error) {
        // throw new ApiError(500, 'Something went wrong while creating Tokens,try again!!!!!', error.message)
        console.log(error.message)
    }
}
export const loginUser = asyncHandler(async function (req, res) {
    //req details 
    // username / email
    // findUser
    // check password
    // if password correct,access token and refreshtoken
    const { username, email, password } = req.body
    if (!(username || email)) {
        throw new ApiError(400, 'Username or email is required')
    }
    const user = await User.findOne({ $or: [{ email }, { username }] })
    if (!user) {
        throw new Error(404, 'No user exists')
    }
    const isvalidPassword = await user.isPasswordCorrect(password)
    if (!isvalidPassword) {
        throw new Error(401, 'Password does not match')
    }
    const { acessToken, refreshToken } = await GenerateAcessandRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200).cookie('acessToken', acessToken, options).cookie('refreshToken', refreshToken, options)
        .json(
            new ApiResponse(
                200, {
                user: loggedInUser,
                acessToken,
                refreshToken
            },
                "User loggedin success!!!"
            )
        )
})
export const logoutUser = asyncHandler(async function (req, res) {
    await User.findByIdAndUpdate(req.user._id, { $unset: { refreshToken: 1 } }, { new: true })
    const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200).clearCookie('acessToken', options).clearCookie('refreshToken', options).json(new ApiResponse(200, {}, 'User logged out success!!!!!'))
})
export const RefreshTheAcessToken = asyncHandler(async function () {
    const incomingRefToken = req.cookies?.refreshToken || req.body.refreshToken
    if (!incomingRefToken) {
        throw new ApiError(401, 'Unauthorized request')
    }
    try {
        const decoedToken = jwt.verify(incomingRefToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decoedToken._id)
        if (!user) {
            throw new ApiError(401, 'Unauthorized request')
        }
        if (incomingRefToken != user.refreshToken) {
            throw new ApiError(401, 'Reefresh Token expired or used!!!!')
        }
        const options = {
            httpOnly: true,
            secure: true
        }
        const { acessToken, newrefreshToken } = await GenerateAcessandRefreshToken(user._id);
        return res.status(200).cookie('acessToken', acessToken, options).cookie('refreshToken', newrefreshToken, options).json(
            new ApiResponse(200, {
                acessToken, refreshToken: newrefreshToken
            }, 'New Token created!!!!')
        )
    } catch (error) {
        throw new ApiError(400, error.message)
    }
})