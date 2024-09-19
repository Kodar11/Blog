import mongoose, { Schema } from "mongoose";

interface IComment extends Document{
    blog_id : mongoose.Types.ObjectId;
    is_liked : boolean
}

const commentSchema = new Schema<IComment>(
    {
        blog_id :{
            type : Schema.Types.ObjectId,
            ref : "Blog"
        },
        is_liked : {
            type : Boolean
        }
    }
)

