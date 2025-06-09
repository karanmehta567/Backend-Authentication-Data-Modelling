import mongoose from "mongoose";

const SubSchema = new mongoose.Schema({
    Subscriber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    Channel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true })
export const Subscription = mongoose.model('Subscription', SubSchema)