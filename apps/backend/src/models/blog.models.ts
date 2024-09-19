import mongoose, { Schema, Document } from "mongoose";

// Define an interface for the blog document
interface IBlog extends Document {
    blog_title: string;
    author_id: mongoose.Types.ObjectId; // Changed to ObjectId for reference
    blog_content: string;
    blog_comments: mongoose.Types.ObjectId[];
}

// Define the blog schema
const blogSchema = new Schema<IBlog>(
    {
        blog_title: {
            type: String,
            required: true,
            index: true,
            unique: true
        },
        author_id: {
            type: Schema.Types.ObjectId,
            ref: "User", // Reference to the User model
            required: true,
            index: true
        },
        blog_content: {
            type: String,
            required: true,
            trim: true
        },
        blog_comments: [
            {
                type: Schema.Types.ObjectId,
                ref: "Comment"
            }
        ]
    },
    {
        timestamps: true
    }
);

// Create and export the Blog model
export const Blog = mongoose.model<IBlog>("Blog", blogSchema);
