"use client"

import { SignInAction } from "@/lib/actions/auth"
import { TfiMicrosoftAlt } from "react-icons/tfi"
import { Button } from "./ui/button"

const MicrosoftSignInButton = () => {
    return (
        <Button
            onClick={() => SignInAction("microsoft-entra-id")}
            className="h-12 gap-2 text-base font-medium shadow-sm"
        >
            <TfiMicrosoftAlt className="h-5 w-5 shrink-0 text-muted-foreground" />
            Belépés Microsoft Entra ID-val
        </Button>
    )
}

export default MicrosoftSignInButton