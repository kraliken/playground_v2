// lib/mappers/topic.js
export function toTopicDto(topic) {
    if (!topic?._id) {
        throw new Error("Invalid topic: missing _id");
    }

    return {
        id: String(topic._id),
        name: topic.name ?? "",
        slug: topic.slug ?? "",
        description: topic.description ?? "",
        createdAt: topic.createdAt instanceof Date
            ? topic.createdAt.toISOString()
            : String(topic.createdAt),
    };
}

export function toTopicDtos(topics) {
    if (!Array.isArray(topics)) {
        throw new Error("topics must be an array");
    }

    return topics.map(toTopicDto);
}
