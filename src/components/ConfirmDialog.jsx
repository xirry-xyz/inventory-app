import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import * as React from "react"

export const ConfirmDialog = React.forwardRef(({
    title = "确定吗？",
    description = "此操作无法撤销。",
    actionText = "确定",
    cancelText = "取消",
    onConfirm,
    trigger,
    children
}, ref) => {
    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                {trigger || children}
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>{title}</AlertDialogTitle>
                    <AlertDialogDescription>
                        {description}
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>{cancelText}</AlertDialogCancel>
                    <AlertDialogAction onClick={onConfirm}>{actionText}</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )
})

ConfirmDialog.displayName = "ConfirmDialog"
