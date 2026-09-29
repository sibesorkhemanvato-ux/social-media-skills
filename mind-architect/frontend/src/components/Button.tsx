import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { ArrowUpLeft } from './Icons'

type Common = { children: ReactNode; variant?: 'primary' | 'secondary' | 'text'; arrow?: boolean; className?: string }
type ButtonProps = Common & ButtonHTMLAttributes<HTMLButtonElement> & { href?: never }
type LinkProps = Common & AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }

export function Button({ children, variant = 'primary', arrow = true, className = '', ...props }: ButtonProps | LinkProps) {
  const classes = `button button--${variant} ${className}`
  if ('href' in props && props.href) {
    return <a className={classes} {...props}>{children}{arrow && <ArrowUpLeft className="button__arrow" />}</a>
  }
  return <button className={classes} {...(props as ButtonProps)}>{children}{arrow && <ArrowUpLeft className="button__arrow" />}</button>
}
