import EmbeddingDocumentList from "@/components/embedding/EmbeddingDocumentList";
import { getMyDocumentsWithTopicAction } from "@/lib/actions/documents";


const RagDocumentsPage = async () => {

    const res = await getMyDocumentsWithTopicAction();

    return (
        <div className="flex flex-col gap-4">
            <EmbeddingDocumentList documents={res.documents} />
        </div>
    )
}

export default RagDocumentsPage