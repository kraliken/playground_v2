import { getAllTopicAction } from '@/action/topic';
import UploadContentCard from '@/components/form/content/UploadContentCard';
import CreateTopicCard from '@/components/form/topics/CreateTopicCard';
import TopicList from '@/components/list/topics/TopicList';

const RagTopicsPage = async () => {

    const { data } = await getAllTopicAction()

    return (
        <div className='flex flex-col gap-4'>
            {/* oldal fejléc */}

            <div className='flex gap-4 items-stretch'>

                {/* form a témakör létrehozására */}
                <div className='flex-1'>
                    <CreateTopicCard />
                </div>

                {/* form a tartalom feltöltésére létrehozására */}
                <div className='flex-1'>
                    <UploadContentCard topics={data} />
                </div>

            </div>

            {/* témakör lista megjelenítése */}
            <TopicList topics={data} />
        </div>
    )
}

export default RagTopicsPage