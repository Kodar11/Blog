import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middlewares.js";


import {
    createBlog,
    fetchBlog
} from "../controllers/blog.controllers.js"

const blogRouter = Router()

blogRouter.route("/write").post(verifyJWT,createBlog)
blogRouter.route("/read").get(verifyJWT,fetchBlog)

export default blogRouter