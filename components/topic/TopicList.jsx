"use client"

import { Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Item, ItemActions, ItemContent, ItemHeader } from '../ui/item';
import { useMemo, useState, useTransition } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { deleteTopicCascadeAction } from '@/lib/actions/topics';

const TopicList = ({ topics }) => {

    const [isPending, startTransition] = useTransition();
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [toast, setToast] = useState(null);

    const selectedName = useMemo(() => {
        if (!selected) return "";
        const t = topics.find(x => x.id === selected);
        return t?.name || "";
    }, [selected, topics]);

    const onAskDelete = (topicId) => {
        setSelected(topicId);
        setOpen(true);
        setToast(null);
    };

    const onConfirmDelete = () => {
        if (!selected) return;
        startTransition(async () => {
            const res = await deleteTopicCascadeAction({ topicId: selected });
            if (!res?.ok) {
                setToast(res?.message || "Nem sikerült törölni.");
                return;
            }
            setToast(res?.message || "Törölve.");
            setOpen(false);
            setSelected(null);
            // A revalidatePath miatt a page újrarenderel, a lista frissül.
        });
    };

    return (
        <Card className="">
            <CardHeader>
                <CardTitle className="text-base">Témakörök</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {toast ? (
                    <div className="text-sm opacity-80">{toast}</div>
                ) : null}
                {topics.map(topic => (
                    <Item key={topic.id} variant="muted" className="flex flex-row">
                        <ItemContent>

                            <ItemHeader>{topic.name}</ItemHeader>
                        </ItemContent>
                        <ItemActions>
                            <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => onAskDelete(topic.id)}
                                disabled={isPending}
                                aria-label={`Témakör törlése: ${topic.name}`}
                            >
                                <Trash2 />
                            </Button>
                        </ItemActions>
                    </Item>
                ))}
            </CardContent>


            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Témakör törlése</AlertDialogTitle>
                        <AlertDialogDescription>
                            Biztosan törlöd a(z) <b>{selectedName}</b> témakört?
                            <br />
                            A kapcsolódó dokumentumok, chunkok és subchunkok is törlődnek.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isPending}>Mégse</AlertDialogCancel>
                        <AlertDialogAction onClick={onConfirmDelete} disabled={isPending}>
                            {isPending ? "Törlés..." : "Igen, törlöm"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Card>
    )
}

export default TopicList