import TopicCreateFormCard from '@/components/topic/TopicCreateFormCard';
import TopicList from '@/components/topic/TopicList';
import TxtUploadFormCard from '@/components/topic/TxtUploadFormCard';
import { getTopicListAction } from '@/lib/actions/topics'

const RagTopicsPage = async () => {

    const { topics } = await getTopicListAction()

    return (
        <div className='flex flex-col gap-4'>
            {/* oldal fejléc */}

            <div className='flex gap-4 items-stretch'>

                {/* form a témakör létrehozására */}
                <div className='flex-1'>
                    <TopicCreateFormCard />
                </div>

                {/* form a tartalom feltöltésére létrehozására */}
                <div className='flex-1'>
                    <TxtUploadFormCard topics={topics} />
                </div>

            </div>

            {/* témakör lista megjelenítése */}
            <TopicList topics={topics} />
        </div>
    )
}

export default RagTopicsPage