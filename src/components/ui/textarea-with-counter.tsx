import * as React from "react"
import { cn } from "@/lib/utils"
import { Textarea } from "@/components/ui/textarea"

export interface TextareaWithCounterProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  maxLength: number
  showCounter?: boolean
  counterClassName?: string
}

const TextareaWithCounter = React.forwardRef<
  HTMLTextAreaElement,
  TextareaWithCounterProps
>(({ className, maxLength, showCounter = true, counterClassName, ...props }, ref) => {
  const [value, setValue] = React.useState(props.value || props.defaultValue || "")
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    if (newValue.length <= maxLength) {
      setValue(newValue)
      props.onChange?.(e)
    }
  }

  React.useEffect(() => {
    setValue(props.value || "")
  }, [props.value])

  const currentLength = String(value).length
  const isNearLimit = currentLength > maxLength * 0.8
  const isOverLimit = currentLength > maxLength

  return (
    <div className="relative">
      <Textarea
        className={cn(
          className,
          isOverLimit && "border-red-500 focus:ring-red-500"
        )}
        {...props}
        ref={ref}
        value={value}
        onChange={handleChange}
        maxLength={maxLength}
      />
      {showCounter && (
        <div className={cn(
          "absolute bottom-2 right-3 text-xs",
          isOverLimit 
            ? "text-red-500 font-medium" 
            : isNearLimit 
            ? "text-orange-500" 
            : "text-muted-foreground",
          counterClassName
        )}>
          {currentLength}/{maxLength}
        </div>
      )}
    </div>
  )
})
TextareaWithCounter.displayName = "TextareaWithCounter"

export { TextareaWithCounter } 