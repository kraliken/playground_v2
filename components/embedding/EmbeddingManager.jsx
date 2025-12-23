import React from 'react'
import EmbeddingTopicTree from './EmbeddingTopicTree'

const EmbeddingManager = ({ data }) => {

    const topics = data ?? [];

    return (
        <div className='flex flex-col gap-4'>
            {topics.map(topic => (
                <EmbeddingTopicTree key={topic.id} topic={topic} />
            ))}
        </div>
    )
}

export default EmbeddingManager