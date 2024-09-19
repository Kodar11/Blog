import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";

// Define a type for the JWT payload
interface DecodedToken extends JwtPayload {
    _id: string;
}

// Extend Express Request to include the user object
interface CustomRequest extends Request {
    user?: any; // Use "any" for simplicity, as you're still learning TypeScript
}

// Middleware to verify JWT
export const verifyJWT = asyncHandler(async (req: CustomRequest, res: Response, next: NextFunction) => {
    try {
        const token =
            req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

        if (!token) {
            throw new ApiError(401, "Unauthorized request");
        }

        // Decode the JWT
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || "") as DecodedToken;

        // Find the user in the database, omitting sensitive fields
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            throw new ApiError(401, "Invalid Access Token");
        }

        req.user  = user; // Attach the user object to the request
        next();
    } catch (error: any) {
        throw new ApiError(401, error?.message || "Invalid access token");
    }
});
