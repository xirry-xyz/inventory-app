import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { UserPlus } from "lucide-react"
import { useState } from "react"

export function InviteMemberDialog({ onInvite }) {
    const [open, setOpen] = useState(false)
    const [email, setEmail] = useState("")

    const handleSubmit = (e) => {
        e.preventDefault()
        if (email && email.trim()) {
            onInvite(email.trim())
            setOpen(false)
            setEmail("")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1">
                    <UserPlus className="h-4 w-4" />
                    邀请
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>邀请新成员</DialogTitle>
                        <DialogDescription>
                            通过 Gmail 地址邀请家庭成员加入此清单。
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Gmail
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="user@gmail.com"
                                className="col-span-3"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoFocus
                                required
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">发送邀请</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
