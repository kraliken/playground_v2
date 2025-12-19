
// lib/constans/index.js

import { Files, FolderPlus, Info, MessageSquare, NotepadText } from "lucide-react";

export const ragAppLinks = [
    {
        label: "Áttekintés",
        icon: <Info className="h-4 w-4" />,
        href: "/dashboard/rag/overview",
    },
    {
        label: "Témakörök",
        icon: <FolderPlus className="h-4 w-4" />,
        href: "/dashboard/rag/topics",
    },
    {
        label: "Dokumentumok",
        icon: <Files className="h-4 w-4" />,
        href: "/dashboard/rag/docs",
    },
    {
        label: "Tartalmak",
        icon: <NotepadText className="h-4 w-4" />,
        href: "/dashboard/rag/contents",
    },
    {
        label: "Chat",
        icon: <MessageSquare className="h-4 w-4" />,
        href: "/dashboard/rag/chat",
    },

]