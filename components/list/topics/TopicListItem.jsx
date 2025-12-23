"use client"

import { Button } from "@/components/ui/button"
import { Item, ItemActions, ItemContent, ItemTitle } from "@/components/ui/item"
import { Tag, Trash } from "lucide-react"
import DeleteTopicDialog from "./DeleteTopicDialog"
import { useState } from "react"

const formatDate = (date) => {
    return new Date(date).toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

const TopicListItem = ({ topic }) => {

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    return (
        <>
            <Item variant="muted" className="flex items-start gap-12">
                <ItemContent>
                    <ItemTitle className="flex items-center gap-2">
                        <Tag className="size-4 text-muted-foreground" />
                        {topic.title}
                    </ItemTitle>
                    <div className="flex justify-between items-center gap-12 mt-2">
                        <div className="flex-1 text-xs text-muted-foreground">
                            Létrehozva: {formatDate(topic.createdAt)}
                        </div>

                    </div>
                </ItemContent>

                <ItemActions>
                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setDeleteDialogOpen(true)}
                    >
                        <Trash className="" />
                    </Button>
                </ItemActions>
            </Item>

            <DeleteTopicDialog
                topicId={topic.id}
                title={topic.title}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    )
}

export default TopicListItem