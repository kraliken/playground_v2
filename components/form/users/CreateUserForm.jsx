"use client"

import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { createUser } from '@/action/user'

const initialState = { ok: undefined, error: "", errors: {}, data: {} }

const CreateUserForm = () => {

    const [state, formAction, pending] = useActionState(createUser, initialState)

    useEffect(() => {
        if (state.ok === undefined) return
        if (state.ok) toast.success(state.message)
        if (!state.ok) toast.error(state.error)
    }, [state])

    return (
        <form action={formAction} className='flex flex-col items-start gap-6'>
            <Field>
                <FieldLabel htmlFor="fullname">Teljes név</FieldLabel>
                <Input
                    id="fullname"
                    name="fullname"
                    type="text"
                    placeholder="Max Leiter"
                    defaultValue={state.data.fullname ?? ""}
                    aria-invalid={!!state.errors?.fullname}
                />
                {state.errors?.fullname && (
                    <FieldError>{state.errors.fullname}</FieldError>
                )}
            </Field>
            <Field>
                <FieldLabel htmlFor="email">Email</FieldLabel>
                <Input
                    id="email"
                    name="email"
                    type="text"
                    placeholder="name@example.com"
                    defaultValue={state.data.email ?? ""}
                    aria-invalid={!!state.errors?.email}
                />
                {state.errors?.email && (
                    <FieldError>{state.errors.email}</FieldError>
                )}
            </Field>

            {state.errors?.hashedPassword && < Alert variant="destructive">
                <AlertDescription>
                    {state.errors?.hashedPassword}
                </AlertDescription>
            </Alert>}

            <Button type="submit" disabled={pending}>
                {pending ? "Felhasználó regisztrálása..." : "Felhasználó regisztrálása"}
            </Button>
        </form>
    )
}

export default CreateUserForm