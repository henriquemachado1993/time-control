"use client"

import * as React from "react"
import { IconAlertTriangle, IconLoader2, IconTrash } from "@tabler/icons-react"

import { useMediaQuery } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
  onConfirm: () => void | boolean | Promise<void | boolean>
  isConfirming?: boolean
  error?: string
  onCancel?: () => void
  children?: React.ReactNode
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  variant = "default",
  onConfirm,
  isConfirming = false,
  error,
  onCancel,
  children,
}: ConfirmationDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")

  const handleConfirm = async () => {
    if (isConfirming) return
    const completed = await onConfirm()
    if (completed !== false) onOpenChange(false)
  }

  const handleCancel = () => {
    if (isConfirming) return
    onCancel?.()
    onOpenChange(false)
  }

  if (isDesktop) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {variant === "destructive" ? (
                <IconAlertTriangle className="h-5 w-5 text-destructive" />
              ) : (
                <IconTrash className="h-5 w-5" />
              )}
              {title}
            </DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          {children}
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleConfirm}
              variant={variant === "destructive" ? "destructive" : "default"}
              className="flex-1"
              disabled={isConfirming}
            >
              {isConfirming && <IconLoader2 className="size-4 animate-spin" aria-hidden="true" />}
              {isConfirming ? "Excluindo..." : confirmText}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1"
              disabled={isConfirming}
            >
              {cancelText}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="flex items-center gap-2">
            {variant === "destructive" ? (
              <IconAlertTriangle className="h-5 w-5 text-destructive" />
            ) : (
              <IconTrash className="h-5 w-5" />
            )}
            {title}
          </DrawerTitle>
          <DrawerDescription>{description}</DrawerDescription>
        </DrawerHeader>
        <div className="px-4">
          {children}
          {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
        </div>
        <DrawerFooter className="pt-2">
          <Button
            onClick={handleConfirm}
            variant={variant === "destructive" ? "destructive" : "default"}
            disabled={isConfirming}
          >
            {isConfirming && <IconLoader2 className="size-4 animate-spin" aria-hidden="true" />}
            {isConfirming ? "Excluindo..." : confirmText}
          </Button>
          <Button variant="outline" onClick={handleCancel} disabled={isConfirming}>{cancelText}</Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  )
}
