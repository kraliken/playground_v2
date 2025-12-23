"use client"

import { SignOutAction } from '@/action/auth'
import { Button } from './ui/button'
import { LogOut } from 'lucide-react'

const SignOutButton = () => {
    return (
        <Button
            variant="destructive"
            size="sm"
            className="flex-1"
            onClick={() => SignOutAction()}
        >
            <LogOut /> Kilépés
        </Button>
    )
}

export default SignOutButton