"use client"

import React, { useActionState, useEffect, useState } from 'react'
import TopicSelector from '../shared/TopicSelector'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { uploadContentAction } from '@/action/content'
import { Alert, AlertDescription } from '@/components/ui/alert'

const initialState = { ok: undefined, error: "", errors: {}, data: {} }

const UploadContentForm = ({ topics }) => {

    const [selectedTopicId, setSelectedTopicId] = useState("")
    const hasTopics = Array.isArray(topics) && topics.length > 0

    const [state, formAction, pending] = useActionState(uploadContentAction, initialState)

    useEffect(() => {
        if (state.ok === undefined) return
        if (state.ok) toast.success(state.message)
        if (!state.ok) toast.error(state.error)
    }, [state])

    return (
        <form action={formAction} className='h-full flex flex-col items-end gap-6'>
            <TopicSelector
                state={state}
                topics={topics}
                selectedTopicId={selectedTopicId}
                setSelectedTopicId={setSelectedTopicId}
                hasTopics={hasTopics}
                pending={pending}
            />
            <input type="hidden" name="topicId" value={selectedTopicId} />
            <Field>
                <FieldLabel htmlFor="file">TXT kiválasztása</FieldLabel>
                <Input
                    id="file"
                    name="file"
                    type="file"
                    accept=".txt,text/plain"
                    disabled={!selectedTopicId || !hasTopics || pending}
                    aria-invalid={!!state.errors?.file}
                />
                {state.errors?.file && (
                    <FieldError>{state.errors.file}</FieldError>
                )}
            </Field>

            {state.errors.title && < Alert variant="destructive">
                <AlertDescription>
                    {state?.errors?.title}
                </AlertDescription>
            </Alert>}

            <Button type="submit" disabled={!selectedTopicId || !hasTopics || pending} className="mt-auto">
                {pending ? "Feltöltés..." : "Feltöltés"}
            </Button>
        </form>
    )
}

export default UploadContentForm