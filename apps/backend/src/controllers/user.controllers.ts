import { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";

import { User} from "../models/user.models.js"

import {loginSchema,registerSchema} from "../utils/zod.js"

// Define return type for clarity
interface TokenResponse {
    accessToken: string;
    refreshToken: string;
}

// Define the function and types
const generateAccessAndRefreshTokens = async (userId: string): Promise<TokenResponse> => {
    try {
        // Find the user by their ID
        const user = await User.findById(userId);

        // Handle case where user is not found
        if (!user) {
            throw new ApiError(404, "User not found");
        }

        // Generate access and refresh tokens
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // Update the user's refresh token
        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        // Return the tokens
        return { accessToken, refreshToken };
    } catch (error:any) {
        throw new ApiError(500, error.message || "Something went wrong while generating refresh and access tokens");
    }
};

const registerUser = asyncHandler(async (req, res) => {

    const parsedBody = registerSchema.parse(req.body);

    const { username, email, password } = parsedBody;

    // Validate input fields are not empty
    if (
        [email, username, password].some((field) => !field || field.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    // Check if user already exists by username or email
    const existingUser = await User.findOne({
        $or: [{ username: username.toLowerCase() }, { email: email.toLowerCase() }]
    });

    if (existingUser) {
        throw new ApiError(409, "User with email or username already exists");
    }

    // Create new user
    const user = await User.create({
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password,
    });

    // Remove sensitive fields from the response
    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user");
    }

    // Return the created user
    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );
});


// Define the interface for login request body
interface LoginRequestBody {
    username: string;
    password: string;
}

const loginUser = asyncHandler(async (req: Request<{}, {}, LoginRequestBody>, res: Response) => {

    const parsedBody = loginSchema.parse(req.body);

    const { username, password } = parsedBody;

    // Check if username and password are provided
    if (!username || !password) {
        throw new ApiError(400, "Username and password are required");
    }

    // Find the user by username
    const user : any = await User.findOne({ username });

    // Check if the user exists
    if (!user) {
        throw new ApiError(404, "User does not exist");
    }

    // Check if the password is valid
    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    // Generate Access and Refresh tokens
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);

    // Fetch the logged-in user details without password and refreshToken
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    // Set cookie options (with proper types)
    const options: any = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Use secure in production
        sameSite: "lax"
    };

    // Set the accessToken in the cookies
    res.cookie("accessToken", accessToken, options);

    // Respond with the user data and tokens
    return res.status(200).json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in successfully"
        )
    );
});
export interface IGetUserAuthInfoRequest extends Request {
    user: any; // Replace `User` with the appropriate type for your user object
}
// @ts-ignore
const logoutUser = asyncHandler(async (req: IGetUserAuthInfoRequest, res: Response) => {
    // Ensure req.user is typed correctly
    const userId = req.user?._id; // Safely access user ID

    if (!userId) {
        return res.status(400).json(new ApiResponse(400, {}, "User not logged in"));
    }

    await User.findByIdAndUpdate(
        userId,
        {
            $unset: {
                refreshToken: 1 // Remove refreshToken field from document
            }
        },
        {
            new: true
        }
    );

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
        .status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"));
});


// const refreshAccessToken = asyncHandler(async (req, res) => {
//     const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

//     if (!incomingRefreshToken) {
//         throw new ApiError(401, "unauthorized request")
//     }

//     try {
//         const decodedToken = jwt.verify(
//             incomingRefreshToken,
//             process.env.REFRESH_TOKEN_SECRET
//         )
    
//         const user = await User.findById(decodedToken?._id)
    
//         if (!user) {
//             throw new ApiError(401, "Invalid refresh token")
//         }
    
//         if (incomingRefreshToken !== user?.refreshToken) {
//             throw new ApiError(401, "Refresh token is expired or used")
            
//         }
    
//         const options = {
//             httpOnly: true,
//             secure: true
//         }
    
//         const {accessToken, newRefreshToken} = await generateAccessAndRefereshTokens(user._id)
    
//         return res
//         .status(200)
//         .cookie("accessToken", accessToken, options)
//         .cookie("refreshToken", newRefreshToken, options)
//         .json(
//             new ApiResponse(
//                 200, 
//                 {accessToken, refreshToken: newRefreshToken},
//                 "Access token refreshed"
//             )
//         )
//     } catch (error) {
//         throw new ApiError(401, error?.message || "Invalid refresh token")
//     }

// })

// const changeCurrentPassword = asyncHandler(async(req, res) => {
//     const {oldPassword, newPassword} = req.body

    

//     const user = await User.findById(req.user?._id)
//     const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

//     if (!isPasswordCorrect) {
//         throw new ApiError(400, "Invalid old password")
//     }

//     user.password = newPassword
//     await user.save({validateBeforeSave: false})

//     return res
//     .status(200)
//     .json(new ApiResponse(200, {}, "Password changed successfully"))
// })


// const getCurrentUser = asyncHandler(async(req, res) => {
//     return res
//     .status(200)
//     .json(new ApiResponse(
//         200,
//         req.user,
//         "User fetched successfully"
//     ))
// })

// const updateAccountDetails = asyncHandler(async(req, res) => {
//     const {fullName, email} = req.body

//     if (!fullName || !email) {
//         throw new ApiError(400, "All fields are required")
//     }

//     const user = await User.findByIdAndUpdate(
//         req.user?._id,
//         {
//             $set: {
//                 fullName,
//                 email: email
//             }
//         },
//         {new: true}
        
//     ).select("-password")

//     return res
//     .status(200)
//     .json(new ApiResponse(200, user, "Account details updated successfully"))
// });


export{
    registerUser,
    loginUser,
    logoutUser
}

// export {
//     registerUser,
//     loginUser,
//     logoutUser,
//     refreshAccessToken,
//     changeCurrentPassword,
//     getCurrentUser,
//     updateAccountDetails,
// }