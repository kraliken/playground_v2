import RagChatPanel from '@/components/chat/RagChatPanel'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getAllTopicAction } from '@/lib/actions/topics'
import React from 'react'

const RagChatPage = async () => {

    const { topics } = await getAllTopicAction()

    // lekérjük a topic-ok listáját - SERVER ACTION


    // ha nincs topic, akkor üzenet megjelenítése - KOMPONENS

    const render = false

    if (render) {
        return (
            <Card className="rounded-2xl">
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

    // lekérjök az alcímeket - opcionálisan ezekből tud választania  felhasználó - SERVER ACTION


    // chat pane megjelenítése - KOMPONENS

    if (!render) {
        return (
            <RagChatPanel topics={topics} />
        )
    }



}

export default RagChatPage