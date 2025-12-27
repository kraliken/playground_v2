"use client"

import { useTransition } from "react";
import { SignInAction } from "@/lib/actions/auth"
import { TfiMicrosoftAlt } from "react-icons/tfi"
import { Button } from "./ui/button"

const MicrosoftSignInButton = () => {

    const [isPending, startTransition] = useTransition();

    const onMicrosoftSignIn = () => {
        startTransition(() => {
            SignInAction("microsoft-entra-id");
        });
    };

    return (
        <Button
            onClick={onMicrosoftSignIn}
            disabled={isPending}
        >
            <TfiMicrosoftAlt className="h-5 w-5 shrink-0 text-muted-foreground" />
            {isPending ? "Belépés..." : "Belépés Microsoft Entra ID-val"}
        </Button>
    )
}

export default MicrosoftSignInButton