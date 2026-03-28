import { ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  className?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`
          inline-flex
          items-center
          justify-center
          px-4
          py-2
          border
          border-transparent
          text-sm
          font-medium
          rounded-md
          shadow-sm
          focus:outline-none
          focus:ring-2
          focus:ring-offset-2
          disabled:opacity-50
          disabled:cursor-not-allowed
          ${className}
        `}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
