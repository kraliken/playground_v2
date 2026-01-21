
// lib/constans/index.js

import { CloudUpload, Database, FileCheck, FolderPlus, Info, Layers, MessageSquare, NotepadText, Settings2, Users } from "lucide-react";

export const ragAppLinks = [
    {
        label: "Áttekintés",
        icon: <Info className="h-4 w-4" />,
        href: "/dashboard/rag/overview",
        roles: ["user", "admin"],
    },
    {
        label: "Témakörök",
        icon: <FolderPlus className="h-4 w-4" />,
        href: "/dashboard/rag/topics",
        roles: ["admin"],
    },
    {
        label: "Tartalomfeldolgozás",
        icon: <Settings2 className="h-4 w-4" />,
        href: "/dashboard/rag/docs",
        roles: ["admin"],
    },
    {
        label: "Tartalmak",
        icon: <NotepadText className="h-4 w-4" />,
        href: "/dashboard/rag/contents",
        roles: ["user", "admin"],
    },
    {
        label: "Chat",
        icon: <MessageSquare className="h-4 w-4" />,
        href: "/dashboard/rag/chat",
        roles: ["user", "admin"],
    },
]

export const docIntLinks = [
    {
        label: "Számla feltöltés",
        icon: <CloudUpload className="h-4 w-4" />,
        href: "/dashboard/docint/upload",
        roles: ["admin"],
    },
    {
        label: "Batch feldolgozás",
        icon: <Layers className="h-4 w-4" />,
        href: "/dashboard/docint/batch",
        roles: ["admin"],
    },
    {
        label: "Kinyert adatok",
        icon: <FileCheck className="h-4 w-4" />,
        href: "/dashboard/docint/result",
        roles: ["admin"],
    }
]

export const setupLinks = [
    {
        label: "Felhasználók",
        icon: <Users className="h-4 w-4" />,
        href: "/dashboard/users",
        roles: ["admin"],
    }
]

export const UPLOAD_CONSTRAINTS = {
    MAX_FILES: 5, // 50-100 számla
    MAX_FILE_SIZE_BYTES: 25 * 1024 * 1024,
    ALLOWED_MIME_TYPES: ["application/pdf"],
    ALLOWED_EXTENSIONS: [".pdf"],
};

