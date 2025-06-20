import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { validate as isValidEmail } from "email-validator";
import { User } from "../models/userModel.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from 'jsonwebtoken'
import { deleteAvatar } from "../utils/deleteAvatar.js";
import mongoose from "mongoose";
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
export const ChangeCurrentUserPassword = asyncHandler(async function (req, res) {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
    if (!isPasswordCorrect) {
        throw new ApiError(404, 'Password does not match')
    }
    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    return res.status(200).json(
        new ApiResponse(200, {}, 'Password changed success!!!!')
    )
})
export const getCurrentUser = asyncHandler(async function (req, res) {
    return res.status(200).json(
        new ApiResponse(200, req.user, 'Current user fetched!!!')
    )
})
export const updateAccounthHandler = asyncHandler(async function (req, res) {
    const { fullname, email } = req.body;
    if (!(fullname || email)) {
        throw new ApiError(400, 'Fullname or email required')
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: { fullname, email: email }
    }, { new: true }).select('-password')
    return res.status(200).json(
        new ApiResponse(200, user, 'Details changed success!!!')
    )
})
export const updateAvatar = asyncHandler(async function (req, res) {
    const avatrLocalPath = req.file?.path
    if (!avatrLocalPath) {
        throw new ApiError(400, 'File missing')
    }
    //https://cdn.example/uploads/avatar123.png
    if (req.user?.avatar) {
        const publicId = req.user.avatar.split('/').pop().split('.')[0]
        await deleteAvatar(publicId)
    }
    const upload = await uploadOnCloudinary(avatrLocalPath)
    if (!upload.url) {
        throw new ApiError(500, 'Error while uploading to cloud,Try again please!!!!')
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: { avatar: upload.url }
    }, { new: true }).select('-password')
    return res.status(200).json(
        new ApiResponse(200, user, 'Avatar File changed success!!!!')
    )
})
export const getUserProfile = asyncHandler(async function (req, res) {
    const { username } = req.params
    if (!username?.trim()) {
        throw new ApiError(400, 'Username missing!')
    }
    const channel = await User.aggregate([{
        $match: {
            username: username?.toLowerCase()
        }
    }, {
        $lookup: {
            from: 'subscriptions',
            localField: "_id",
            foreignField: "channel",
            as: 'subscribers'
        }
    },
    {
        $lookup: {
            from: 'subscriptions',
            localField: "_id",
            foreignField: "subscriber",
            as: 'subscribedTo'
        }
    },
    {
        $addFields: {
            subscribersCount: {
                $size: '$subscribers'
            },
            channelsAddtoCount: {
                $size: '$subscribedTo'
            },
            isSubscribed: {
                $cond: {
                    if: { $in: [req.user._id, '$subscribers.subscriber'] },
                    then: true,
                    else: false
                }
            }
        }
    },
    {
        $project: {
            fullname: 1,
            username: 1,
            subscribersCount: 1,
            channelsAddtoCount: 1,
            isSubscribed: 1,
            avatar: 1,
            email: 1
        }
    }
    ])
    if (!channel.length) {
        throw new ApiError(400, 'Channel does not exists')
    }

    return res.status(200).json(
        new ApiResponse(200, channel[0], 'User channel fetched')
    )
})
export const getWatchHistory = asyncHandler(async function (req, res) {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: 'videos',
                localField: 'watchHistory',
                foreignField: "_id",
                as: 'watchHistory',
                pipeline: [
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'owner',
                            foreignField: '_id',
                            as: 'owner',
                            pipeline: [
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: '$owner'
                            }
                        }
                    }
                ]
            }
        }
    ])
    return res.status(200).json(
        new ApiResponse(
            200, user[0].watchHistory, 'Watch History Fetched succesfully!'
        )
    )
})