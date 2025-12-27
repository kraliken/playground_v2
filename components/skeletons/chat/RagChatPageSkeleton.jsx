import React from "react";
import RagChatLeftPanelSkeleton from "./RagChatLeftPanelSkeleton";
import RagChatRightPanelSkeleton from "./RagChatRightPanelSkeleton";

export default function RagChatPageSkeleton() {
    return (
        <div className="h-[calc(100vh-68px)] grid gap-4 lg:grid-cols-[360px_1fr] items-stretch pb-4 min-h-0">
            <RagChatLeftPanelSkeleton />
            <RagChatRightPanelSkeleton />
        </div>
    );
}
