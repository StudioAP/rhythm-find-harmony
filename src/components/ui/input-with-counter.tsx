import * as React from "react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

export interface InputWithCounterProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  maxLength: number
  showCounter?: boolean
  counterClassName?: string
}

const InputWithCounter = React.forwardRef<
  HTMLInputElement,
  InputWithCounterProps
>(({ className, maxLength, showCounter = true, counterClassName, ...props }, ref) => {
  const [value, setValue] = React.useState(props.value || props.defaultValue || "")
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      <Input
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
          "absolute -bottom-5 right-0 text-xs",
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
InputWithCounter.displayName = "InputWithCounter"

export { InputWithCounter } 