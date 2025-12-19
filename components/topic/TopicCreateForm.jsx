"use client"

import { useActionState, useEffect, useRef } from "react"
import { Button } from "../ui/button"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "../ui/field"
import { Input } from "../ui/input"
import { Textarea } from "../ui/textarea"
import { createTopicAction } from "@/lib/actions/topics"
import { toast } from "sonner"

const initialState = { ok: undefined, error: "", data: {} }

const TopicCreateForm = () => {

    const formRef = useRef(null)

    const [state, formAction, pending] = useActionState(createTopicAction, initialState)

    useEffect(() => {
        if (state.ok === undefined) {
            return;
        }

        if (state?.ok) {
            toast.success("Témakör létrehozva.");
            formRef.current?.reset()
        }
        if (!state?.ok) {
            toast.error(state.error);
        }
    }, [state.error, state?.ok])

    const data = state?.data || {}

    return (
        <form ref={formRef} action={formAction} className="space-y-4">
            <FieldGroup>
                <Field>
                    <FieldLabel htmlFor="name">Név</FieldLabel>
                    <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="pl. HR szabályzat / Termék dokumentáció"
                        defaultValue={data.name ?? ""}
                    />
                    <FieldDescription>
                        Add meg az új témakör nevét.
                    </FieldDescription>
                </Field>

                <Field>
                    <FieldLabel htmlFor="description">Leírás</FieldLabel>
                    <Textarea
                        id="description"
                        name="description"
                        rows={4}
                        defaultValue={data.description ?? ""}
                    />
                    <FieldDescription>
                        Add meg a témakör rövid leírását (opcionális).
                    </FieldDescription>
                </Field>

                {/* {state?.error ? (
                    <Alert variant="destructive" className="border-destructive">
                        <TriangleAlertIcon />
                        <AlertTitle>{state.error}</AlertTitle>
                    </Alert>
                ) : null}

                {state?.ok ? (
                    <Alert className="border-green-600 text-green-600 dark:border-green-400 dark:text-green-400">
                        <CheckCheckIcon />
                        <AlertTitle>Témakör létrehozva.</AlertTitle>
                    </Alert>
                ) : null} */}

                <div className="flex justify-end">
                    <Button type="submit" disabled={pending}>
                        {pending ? "Mentés..." : "Mentés"}
                    </Button>
                </div>
            </FieldGroup>
        </form>
    )
}

export default TopicCreateForm