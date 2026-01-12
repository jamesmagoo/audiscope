'use client'

import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

interface EditableTextProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  multiline?: boolean
  variant?: 'default' | 'heading' | 'small'
  disabled?: boolean
}

export function EditableText({
  value,
  onChange,
  placeholder = 'Click to edit...',
  className,
  multiline = false,
  variant = 'default',
  disabled = false,
}: EditableTextProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  useEffect(() => {
    setEditValue(value)
  }, [value])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      if (multiline && inputRef.current instanceof HTMLTextAreaElement) {
        inputRef.current.select()
      } else if (inputRef.current instanceof HTMLInputElement) {
        inputRef.current.select()
      }
    }
  }, [isEditing, multiline])

  const handleClick = () => {
    if (!disabled) {
      setIsEditing(true)
    }
  }

  const handleBlur = () => {
    setIsEditing(false)
    if (editValue.trim() !== value.trim()) {
      onChange(editValue.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !multiline) {
      e.preventDefault()
      inputRef.current?.blur()
    }
    if (e.key === 'Escape') {
      setEditValue(value)
      setIsEditing(false)
    }
  }

  const variantStyles = {
    default: 'text-base',
    heading: 'text-xl font-semibold',
    small: 'text-sm',
  }

  const baseStyles = cn(
    'w-full rounded px-2 py-1 transition-colors',
    'hover:bg-muted/50 cursor-text',
    variantStyles[variant],
    disabled && 'cursor-not-allowed opacity-50 hover:bg-transparent',
    className
  )

  const inputStyles = cn(
    'w-full rounded px-2 py-1 border border-primary focus:outline-none focus:ring-2 focus:ring-ring',
    variantStyles[variant],
    className
  )

  if (isEditing) {
    if (multiline) {
      return (
        <textarea
          ref={inputRef as React.RefObject<HTMLTextAreaElement>}
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(inputStyles, 'min-h-[80px] resize-y')}
          placeholder={placeholder}
        />
      )
    }

    return (
      <input
        ref={inputRef as React.RefObject<HTMLInputElement>}
        type="text"
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={inputStyles}
        placeholder={placeholder}
      />
    )
  }

  return (
    <div
      onClick={handleClick}
      className={baseStyles}
      title={disabled ? '' : 'Click to edit'}
    >
      {value || <span className="text-muted-foreground">{placeholder}</span>}
    </div>
  )
}
