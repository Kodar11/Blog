import { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";

import { Blog } from "../models/blog.models.js";

export interface IGetUserRequest extends Request {
    user: any; // Replace `User` with the appropriate type for your user object
}

// @ts-ignore
const createBlog = asyncHandler(async (req : IGetUserRequest,res : Response) =>{
    const {blog_title,blog_content} = req.body;

    const author_id = req.user._id;

    if(!author_id){
        throw new ApiError(400,"User is not Logged in");
    }

    if (
        [blog_title,blog_content].some((field) => !field || field.trim() === "")
    ) {
        throw new ApiError(400, "All fields are required");
    }

    const existingBlog = await Blog.findOne({
        $or: [{ blog_title: blog_title.toLowerCase() }]
    });

    if (existingBlog) {
        throw new ApiError(409, "Blog already exists");
    }

    const blog = await Blog.create({
        blog_title,
        blog_content,
        author_id,
    });

    const createdBlog = await Blog.findById(blog._id);

    if (!createBlog) {
        throw new ApiError(500, "Something went wrong while creating the blog");
    }

    // Return the created user
    return res.status(201).json(
        new ApiResponse(201, createBlog, "Blog created successfully")
    );


})

const fetchBlog = asyncHandler(async (req: Request, res: Response)=>{
    const blogs = await Blog.find({});

    return res.status(201).json(
        new ApiResponse(201,blogs,"Fetching blog successfully")
    )
})

export {
    createBlog,
    fetchBlog
}