import mongoose from "mongoose";

export const promptSchema = new mongoose.Schema({
    content: {
        type: String, 
        maxlength: 3000
    }
})