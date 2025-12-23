"use client"

import { Lock, LockOpen, Mail, RotateCcw, Trash, User, UserStar } from 'lucide-react'
import DeleteUserDialog from './DeleteUserDialog'
import ResetUserTokensDialog from "./ResetUserTokensDialog"
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Item, ItemActions, ItemContent, ItemTitle } from '@/components/ui/item'
import { Button } from '@/components/ui/button'

const UserListItem = ({ user, currentUserId }) => {

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [resetDialogOpen, setResetDialogOpen] = useState(false)

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('hu-HU', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const roleLabel = {
        user: "Felhasználó",
        admin: "Admin"
    }

    const statusColor = {
        active: "border-none bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 focus-visible:outline-none dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5",
        inactive: "bg-destructive/10 [a&]:hover:bg-destructive/5 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive border-none focus-visible:outline-none"
    }

    const statusLabel = {
        active: "Aktív",
        inactive: "Inaktív"
    }

    const tokenLimit = user.tokenLimit ?? 50000
    const tokensUsed = user.tokensUsed ?? 0
    const tokensRemaining = user.tokensRemaining ?? Math.max(0, tokenLimit - tokensUsed)

    const nf = useMemo(() => new Intl.NumberFormat("hu-HU"), []);
    const fmt = (n) => (typeof n === "number" && Number.isFinite(n) ? nf.format(n) : "—");

    const isAdmin = user.role === "admin"

    return (
        <>
            <Item variant="muted" className="flex items-start gap-12">
                <ItemContent className="gap-6">
                    <ItemTitle className="flex items-center gap-3">
                        {user.role === "user" ? (
                            <User className="size-4 text-muted-foreground" />
                        ) : (
                            <UserStar className="size-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{user.name}</span>
                        {isAdmin &&
                            <Badge
                                variant="outline"
                                className='text-[10px] leading-none border-amber-600 text-amber-600 dark:border-amber-400 dark:text-amber-400 [a&]:hover:bg-amber-600/10 [a&]:hover:text-amber-600/90 dark:[a&]:hover:bg-amber-400/10 dark:[a&]:hover:text-amber-400/90'
                            >
                                {roleLabel[user.role]}
                            </Badge>}
                    </ItemTitle>

                    <div className="mt-2 grid grid-cols-12 gap-x-6 gap-y-2 items-center">
                        {/* Email */}
                        <div className="col-span-3 flex items-center gap-2 text-sm min-w-0">
                            <Mail className="size-4 text-muted-foreground shrink-0" />
                            <span className="truncate">{user.email}</span>
                        </div>

                        {/* Státusz */}
                        <div className="col-span-1 flex items-center">
                            <Badge variant="outline" className={statusColor[user.status]}>
                                {statusLabel[user.status]}
                            </Badge>
                        </div>

                        {/* Jelszó módosítás szükséges (mindig foglal helyet!) */}
                        <div className="col-span-2 flex items-center min-w-0">
                            {user.mustChangePassword ? (
                                <Badge
                                    title="Jelszó módosítás szükséges"
                                    className='bg-destructive/10 [a&]:hover:bg-destructive/5 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive border-none focus-visible:outline-none'
                                >
                                    <Lock />
                                    Jelszó
                                </Badge>
                            ) : (
                                <Badge
                                    title="Módosította a jelszavát"
                                    className='border-none bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 focus-visible:outline-none dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5'
                                >
                                    <LockOpen />
                                    Jelszó
                                </Badge>
                            )}
                        </div>

                        {/* Token */}
                        <div className="col-span-3 flex items-center">
                            <Badge variant="outline" title="Felhasználói token keret">
                                {fmt(tokensUsed)} / {fmt(tokenLimit)}
                            </Badge>
                        </div>

                        {/* Létrehozva */}
                        <div className="col-span-2 text-xs text-muted-foreground text-right whitespace-nowrap">
                            Létrehozva: {formatDate(user.createdAt)}
                        </div>
                    </div>

                </ItemContent>
                <ItemActions className="flex gap-2">

                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => setResetDialogOpen(true)}
                        disabled={tokensRemaining > 0}
                        title="Tokenek nullázása"
                    >
                        <RotateCcw />
                    </Button>
                    <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => setDeleteDialogOpen(true)}
                        disabled={currentUserId === user.id}
                    >
                        <Trash />
                    </Button>
                </ItemActions>
            </Item>

            <ResetUserTokensDialog
                userId={user.id}
                userName={user.name}
                open={resetDialogOpen}
                onOpenChange={setResetDialogOpen}
            />

            <DeleteUserDialog
                userId={user.id}
                userName={user.fullname}
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
            />
        </>
    )
}

export default UserListItem