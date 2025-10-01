import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { cn } from "@/lib/utils"

const EnhancedSelect = SelectPrimitive.Root

const EnhancedSelectGroup = SelectPrimitive.Group

const EnhancedSelectValue = SelectPrimitive.Value

const EnhancedSelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    variant?: 'default' | 'modern'
  }
>(({ className, children, variant = 'default', ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      // Base styles
      "flex h-12 w-full items-center justify-between rounded-lg border bg-white px-4 py-3 text-sm shadow-sm transition-all duration-200",
      // Default variant
      variant === 'default' && [
        "border-slate-300 hover:border-slate-400 hover:shadow-md",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "[&>span]:line-clamp-1"
      ],
      // Modern variant with enhanced UX
      variant === 'modern' && [
        "border-slate-200 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "[&>span]:line-clamp-1",
        // Enhanced hover effect
        "group relative overflow-hidden",
        "before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-200"
      ],
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className={cn(
        "h-4 w-4 transition-transform duration-200",
        variant === 'modern' && "group-hover:text-primary"
      )} />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
EnhancedSelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const EnhancedSelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
))
EnhancedSelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const EnhancedSelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={cn(
      "flex cursor-default items-center justify-center py-1",
      className
    )}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
))
EnhancedSelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const EnhancedSelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={cn(
        "relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-lg border bg-white shadow-xl",
        "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
        "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
        "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
        position === "popper" &&
          "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1",
        className
      )}
      position={position}
      {...props}
    >
      <EnhancedSelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={cn(
          "p-1",
          position === "popper" &&
            "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
      <EnhancedSelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
EnhancedSelectContent.displayName = SelectPrimitive.Content.displayName

const EnhancedSelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={cn("py-2 pl-8 pr-2 text-sm font-semibold text-slate-700", className)}
    {...props}
  />
))
EnhancedSelectLabel.displayName = SelectPrimitive.Label.displayName

const EnhancedSelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "relative flex w-full cursor-default select-none items-center rounded-md py-2.5 pl-8 pr-2 text-sm outline-none",
      "hover:bg-slate-50 hover:text-slate-900 focus:bg-slate-50 focus:text-slate-900",
      "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
      "transition-colors duration-150",
      className
    )}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-primary" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
EnhancedSelectItem.displayName = SelectPrimitive.Item.displayName

const EnhancedSelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={cn("-mx-1 my-1 h-px bg-slate-200", className)}
    {...props}
  />
))
EnhancedSelectSeparator.displayName = SelectPrimitive.Separator.displayName

// Enhanced Select with Rich Content Support
const EnhancedSelectRichTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger> & {
    title?: string
    subtitle?: string
    icon?: React.ReactNode
    showSubtitle?: boolean // New prop to control subtitle visibility
  }
>(({ className, children, title, subtitle, icon, showSubtitle = false, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      // Compact height to match original
      "flex h-10 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-2 shadow-sm",
      "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/10 transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:border-primary",
      "disabled:cursor-not-allowed disabled:opacity-50",
      // Gradient hover effect
      "group relative overflow-hidden",
      "before:absolute before:inset-0 before:bg-gradient-to-r before:from-primary/5 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-200",
      className
    )}
    {...props}
  >
    <div className="flex items-center gap-3 flex-1 min-w-0">
      {icon && (
        <div className="flex-shrink-0 text-primary/70 group-hover:text-primary transition-colors duration-200">
          {icon}
        </div>
      )}
      <div className="flex items-center flex-1 min-w-0">
        {title && (
          <span className="text-sm font-medium text-slate-900 truncate w-full">
            {title}
          </span>
        )}
        {subtitle && showSubtitle && (
          <span className="text-xs text-slate-500 truncate w-full ml-2 leading-tight">
            • {subtitle}
          </span>
        )}
        {!title && !subtitle && children}
      </div>
    </div>
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 text-slate-400 group-hover:text-primary transition-all duration-200 flex-shrink-0 ml-2" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
EnhancedSelectRichTrigger.displayName = "EnhancedSelectRichTrigger"

export {
  EnhancedSelect,
  EnhancedSelectGroup,
  EnhancedSelectValue,
  EnhancedSelectTrigger,
  EnhancedSelectContent,
  EnhancedSelectLabel,
  EnhancedSelectItem,
  EnhancedSelectSeparator,
  EnhancedSelectScrollUpButton,
  EnhancedSelectScrollDownButton,
  EnhancedSelectRichTrigger,
}
