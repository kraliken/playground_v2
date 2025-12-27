import RagChatPageSkeleton from "@/components/skeletons/chat/RagChatPageSkeleton";

export default function Loading() {
    return (
        <div className="w-full min-h-[calc(100vh-68px)]">
            <RagChatPageSkeleton />
        </div>
    );
}
