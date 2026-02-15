"use client"

import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export function SettingsRow({
  id,
  title,
  desc,
  children,
  fullWidth,
}: {
  id?: string
  title: string
  desc?: string
  children?: React.ReactNode
  fullWidth?: boolean
}) {
  return (
    <div className={cn("settings-row", fullWidth && "settings-row-full")}>
      <div className="settings-row-label">
        {id ? (
          <Label htmlFor={id} className="settings-row-title cursor-pointer">
            {title}
          </Label>
        ) : (
          <span className="settings-row-title">{title}</span>
        )}
        {desc && <p className="settings-row-desc">{desc}</p>}
      </div>
      {children && <div className="settings-row-control">{children}</div>}
    </div>
  )
}

export function SettingsField({
  id,
  label,
  desc,
  children,
}: {
  id: string
  label: string
  desc?: string
  children: React.ReactNode
}) {
  return (
    <div className="settings-field">
      <Label htmlFor={id} className="settings-field-label">
        {label}
      </Label>
      {children}
      {desc && <p className="settings-field-desc">{desc}</p>}
    </div>
  )
}
