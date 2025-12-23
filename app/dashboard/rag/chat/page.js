import { getEmbeddedTree } from '@/action/topic'
import { getMyTokenInfoAction } from '@/action/user'
import RagChatPanel from '@/components/chat/RagChatPanel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import React from 'react'

const RagChatPage = async () => {

    const { topics, subTopics, chunks } = await getEmbeddedTree()

    const tokenRes = await getMyTokenInfoAction()
    const initialToken = tokenRes.ok ? tokenRes.token : null

    const topicsArray = Array.isArray(topics) ? topics : []
    const subTopicsArray = Array.isArray(subTopics) ? subTopics : []
    const chunksArray = Array.isArray(chunks) ? chunks : []

    // ezt kiszervezni komponensbe
    if (topicsArray.length < 1) {
        return (
            <Card >
                <CardHeader>
                    <CardTitle className="text-base">Nincs témakör</CardTitle>
                    <CardDescription>
                        Előbb hozz létre egy témakört és tölts fel egy TXT fájlt a Témakörök oldalon.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                    Menj ide: <span className="font-medium">Témakörök</span> → Témakör létrehozása → TXT feltöltés.
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="w-full min-h-[calc(100vh-68px)]">
            <RagChatPanel
                topics={topicsArray}
                subTopics={subTopicsArray}
                chunks={chunksArray}
                initialToken={initialToken}
            />
        </div>
    )




}

export default RagChatPage