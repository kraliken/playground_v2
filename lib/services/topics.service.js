// lib/services/topics.service.js
import { Topic } from "../database/models/Topic";

export async function listTopicsByUserId(userId) {
    if (!userId) {
        throw new Error("userId is required");
    }

    return Topic.find({ createdByUserId: userId })
        .sort({ createdAt: -1 })
        .select("name slug description createdAt")
        .lean();
}

export async function createTopic({ userId, name, description }) {

    const topic = await Topic.create({
        createdByUserId: userId,
        name,
        description: description || "",
    })

    return { topicId: String(topic._id) }
}

export async function getTopicByIdForUser({ topicId, userId }) {
    if (!topicId) throw new Error("topicId is required");
    if (!userId) throw new Error("userId is required");

    return Topic.findOne({ _id: topicId, createdByUserId: userId })
        .select("_id name slug")
        .lean();
}
