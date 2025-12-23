import { Item, ItemActions, ItemContent, ItemTitle } from '../ui/item'
import { Badge } from '../ui/badge'
import { CheckCircle2, CircleAlert, Sparkles } from 'lucide-react'
import { Button } from '../ui/button';

const formatTokens = (n) =>
    (Number(n) || 0).toLocaleString('hu-HU');

const SubTopicListItem = ({ subTopic, onEmbedSubTopic, embeddingSubTopicId }) => {

    const canEmbed = !!subTopic.hasNonEmbeddedChunk;
    const isLoading = embeddingSubTopicId === subTopic.id;

    return (
        <Item variant="muted" className="flex items-start gap-12">
            <ItemContent>
                <ItemTitle className="flex items-center gap-2">
                    {subTopic.title}
                </ItemTitle>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                    {subTopic.status === "EMBEDDED" ? (
                        <Badge
                            className='border-none bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 focus-visible:outline-none dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5'
                        >
                            {subTopic.status}
                        </Badge>
                    ) : subTopic.status === "CHUNKED" ? (
                        <Badge
                            className='border-none bg-amber-600/10 text-amber-600 focus-visible:ring-amber-600/20 focus-visible:outline-none dark:bg-amber-400/10 dark:text-amber-400 dark:focus-visible:ring-amber-400/40 [a&]:hover:bg-amber-600/5 dark:[a&]:hover:bg-amber-400/5'
                        >
                            {subTopic.status}
                        </Badge>
                    ) : (
                        <Badge
                            className='bg-destructive/10 [a&]:hover:bg-destructive/5 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive border-none focus-visible:outline-none'
                        >
                            {subTopic.status}
                        </Badge>
                    )}

                    <Badge variant="outline">{subTopic.chunkCount} chunk</Badge>

                    {/* ÚJ: token badge */}
                    <Badge variant="outline">
                        {formatTokens(subTopic.embeddingTotalTokens)} token
                    </Badge>

                    {canEmbed ? (
                        <Badge
                            variant="outline"
                            className='border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400 [a&]:hover:bg-amber-600/10 [a&]:hover:text-amber-600/90 dark:[a&]:hover:bg-amber-400/10 dark:[a&]:hover:text-amber-400/90'
                        >
                            <CircleAlert className="mr-1 size-3.5" />
                            beágyazás szükséges
                        </Badge>
                    ) : (
                        <Badge
                            variant="outline"
                            className='border-green-600 text-green-600 dark:border-green-400 dark:text-green-400 [a&]:hover:bg-green-600/10 [a&]:hover:text-green-600/90 dark:[a&]:hover:bg-green-400/10 dark:[a&]:hover:text-green-400/90'
                        >
                            <CheckCircle2 className="mr-1 size-3.5" />
                            rendben
                        </Badge>
                    )}
                </div>
            </ItemContent>

            <ItemActions>
                <Button
                    variant={canEmbed ? "default" : "outline"}
                    size="sm"
                    disabled={!canEmbed || isLoading}
                    onClick={() => onEmbedSubTopic(subTopic.id)}
                >
                    <Sparkles className="mr-2 size-4" />
                    {isLoading ? "Folyamatban..." : "Beágyazás"}
                </Button>
            </ItemActions>
        </Item>
    )
}

export default SubTopicListItem