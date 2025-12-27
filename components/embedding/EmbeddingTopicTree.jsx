"use client"

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge';
import SubTopicListItem from './SubTopicListItem';
import { toast } from 'sonner';
import { createEmbeddingAction } from '@/action/embedding';

const EmbeddingTopicTree = ({ topic }) => {

    const subTopics = topic?.subTopics ?? [];

    const [pending, startTransition] = useTransition();
    const [embeddingSubTopicId, setEmbeddingSubTopicId] = useState("");

    const runEmbedding = (subTopicId) => {
        setEmbeddingSubTopicId(subTopicId)
        startTransition(async () => {
            try {
                const res = await createEmbeddingAction(subTopicId);

                if (res?.ok) toast.success(res.message);
                if (!res?.ok) toast.error(res.error);
            } catch (e) {
                toast.error("Hiba történt a beágyazás közben.");
            } finally {
                setEmbeddingSubTopicId("");
            }
        })
    }
    return (
        <Card className="h-full ">
            <CardHeader>
                <CardTitle className="text-base">{topic.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-2 pt-2">
                    <Badge variant="outline">{topic.subTopicCount ?? subTopics.length} altéma</Badge>
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                {subTopics.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Nincs altéma.</div>
                ) : (
                    subTopics.map((subTopic) => {

                        return (
                            <SubTopicListItem
                                key={subTopic.id}
                                subTopic={subTopic}
                                onEmbedSubTopic={runEmbedding}
                                pending={pending}
                                embeddingSubTopicId={embeddingSubTopicId}
                            />
                        );
                    })
                )}
            </CardContent>
        </Card>
    )
}

export default EmbeddingTopicTree