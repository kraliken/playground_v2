import { getAllTopicWithSubTopicsAndChunksAction } from "@/action/topic";
import EmbeddingManager from "@/components/embedding/EmbeddingManager";


const RagEmbeddingManagerPage = async () => {

    const { data } = await getAllTopicWithSubTopicsAndChunksAction();

    return (
        <div className="flex flex-col gap-4">
            <EmbeddingManager data={data} />
        </div>
    )
}

export default RagEmbeddingManagerPage 