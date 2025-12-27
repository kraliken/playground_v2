"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "../ui/card";
import TopicSelector from "../shared/TopicSelector";
import SelectedTopicContent from "./SelectedTopicContent";
import EmptySubTopicsState from "./EmptySubTopicsState";


const ContentContainer = ({ topics }) => {

    const [selectedTopicId, setSelectedTopicId] = useState("");
    const hasTopics = useMemo(() => Array.isArray(topics) && topics.length > 0, [topics]);

    return (
        <>
            <Card>
                <CardContent className="flex flex-col gap-6">
                    <TopicSelector
                        topics={topics}
                        selectedTopicId={selectedTopicId}
                        setSelectedTopicId={setSelectedTopicId}
                        hasTopics={() => hasTopics}
                    />

                </CardContent>
            </Card>
            <Card>
                <CardContent className="flex flex-col gap-6">
                    {selectedTopicId ? (
                        <SelectedTopicContent topicId={selectedTopicId} />
                    ) : (
                        <EmptySubTopicsState />
                    )}
                </CardContent>
            </Card>
        </>
    );
};

export default ContentContainer;
