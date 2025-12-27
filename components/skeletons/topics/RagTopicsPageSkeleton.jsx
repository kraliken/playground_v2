import RagTopicsCardsSkeleton from "./RagTopicsCardsSkeleton";
import RagTopicsListSkeleton from "./RagTopicsListSkeleton";

const RagTopicsPageSkeleton = () => {
    return (
        <div className="flex flex-col gap-4">
            {/* felső két kártya */}
            <RagTopicsCardsSkeleton />

            {/* lista */}
            <RagTopicsListSkeleton />
        </div>
    );
};

export default RagTopicsPageSkeleton;
