"use client"

import { Field, FieldError, FieldLabel } from '../ui/field'
import { Input } from '../ui/input'
import { Button } from '../ui/button'
import { useActionState, useEffect } from 'react'
import { toast } from 'sonner'
import { Alert, AlertDescription } from '../ui/alert'
import { SignInWithCredentialsAction } from '@/action/auth'

const initialState = { ok: undefined, error: "", errors: {}, data: {} }

const SignInForm = () => {

    const [state, formAction, pending] = useActionState(SignInWithCredentialsAction, initialState)

    useEffect(() => {
        if (state.ok === undefined) return
        if (!state.ok && state.error) toast.error(state.error)
    }, [state])

    return (
        <form
            action={formAction}
            className='flex flex-col gap-4'
            aria-busy={pending}
        >
            <Field>
                <FieldLabel htmlFor="email">E-mail</FieldLabel>
                <Input
                    id="email"
                    name="email"
                    type="text"
                    placeholder="name@example.com"
                    defaultValue={state.data.email ?? ""}
                    aria-invalid={!!state.errors?.email}
                    disabled={pending}
                />
                {state.errors?.email && (
                    <FieldError>{state.errors.email}</FieldError>
                )}
            </Field>
            <Field>
                <FieldLabel htmlFor="password">Jelszó</FieldLabel>
                <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder=""
                    defaultValue={state.data.password ?? ""}
                    aria-invalid={!!state.errors?.password}
                    disabled={pending}
                />
                {state.errors?.password && (
                    <FieldError>{state.errors.password}</FieldError>
                )}
            </Field>

            {state.errorMessage && < Alert variant="destructive">
                <AlertDescription>
                    {state.errorMessage}
                </AlertDescription>
            </Alert>}

            <Button type="submit" disabled={pending} className="mt-6">
                {pending ? "Belépés..." : "Belépés"}
            </Button>
        </form>
    )
}

export default SignInForm