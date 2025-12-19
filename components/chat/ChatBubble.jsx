import { cn } from "@/lib/utils"


const ChatBubble = ({ role, children }) => {

    const isUser = role === "user"

    return (
        <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
            <div
                className={cn(
                    "max-w-225 w-full sm:w-auto",
                    "rounded-2xl border px-4 py-3",
                    isUser ? "bg-muted/20" : "bg-background"
                )}
            >
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{children}</div>
            </div>
        </div>
    )
}

export default ChatBubble