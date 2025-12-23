"use client"

import { useActionState, useEffect } from "react"
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { createTopicAction } from "@/action/topic"

const initialState = { ok: undefined, error: "", errors: {}, data: {} }

const CreateTopicForm = () => {

    const [state, formAction, pending] = useActionState(createTopicAction, initialState)

    useEffect(() => {
        if (state.ok === undefined) return
        if (state.ok) toast.success(state.message)
        if (!state.ok) toast.error(state.error)
    }, [state])

    return (
        <form action={formAction} className='h-full flex flex-col items-start gap-6'>
            <Field>
                <FieldLabel htmlFor="title">Elnevezés</FieldLabel>
                <Input
                    id="title"
                    name="title"
                    type="text"
                    placeholder="pl.: Általános Forgalmi Adó"
                    defaultValue={state.data.title ?? ""}
                    aria-invalid={!!state.errors?.title}
                />
                {state.errors?.title && (
                    <FieldError>{state.errors.title}</FieldError>
                )}
            </Field>

            <Field>
                <FieldLabel htmlFor="description">Leírás</FieldLabel>
                <Textarea
                    id="description"
                    name="description"
                    type="text"
                    rows={4}
                    placeholder="Opcionálisan rövid leírás a témakörről..."
                    defaultValue={state.data.description ?? ""}
                    aria-invalid={!!state.errors?.description}
                />
                {state.errors?.description && (
                    <FieldError>{state.errors.description}</FieldError>
                )}
            </Field>

            <Button type="submit" disabled={pending} className="mt-auto">
                {pending ? "Létrehozás..." : "Létrehozás"}
            </Button>
        </form>
    )
}

export default CreateTopicForm