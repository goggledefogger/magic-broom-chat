import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md'
}

const variants = {
  primary: 'bg-indigo-600 hover:bg-indigo-500 text-white',
  secondary: 'bg-gray-700 hover:bg-gray-600 text-gray-200',
  danger: 'bg-red-600 hover:bg-red-500 text-white',
}

const sizes = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-4 py-2',
}

export function Button({ variant = 'primary', size = 'md', className = '', ...props }: ButtonProps) {
  return (
    <button
      className={`font-medium rounded-md disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    />
  )
}
