// app/dashboard/rag/chat/stream/page.js
import { getEmbeddedTree } from "@/action/topic"
import RagChatStreamPanel from "@/components/chat/RagChatStreamPanel"

// és ugyanaz a data-fetch, mint a meglévő rag chat page-ben
export default async function Page() {
    // TODO: hozd ugyanazokat a propsokat, mint a mostani page.js (topics, subTopics, chunks)
    const { topics, subTopics, chunks } = await getEmbeddedTree()
    return <RagChatStreamPanel topics={topics} subTopics={subTopics} chunks={chunks} />
}
