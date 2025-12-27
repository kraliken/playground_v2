import { getAllTopicForSelectAction } from "@/action/topic";
import ContentContainer from "@/components/contents/ContentContainer";


const RagContentsPage = async () => {

    const { data } = await getAllTopicForSelectAction()

    return (
        <div className="flex flex-col gap-4">
            <ContentContainer topics={data} />
        </div>
    )
}

export default RagContentsPage