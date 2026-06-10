import * as React from "react"
import { Button as HeroButton, type ButtonRootProps } from "@heroui/react"

export type LegacyVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
export type LegacySize = 'default' | 'sm' | 'lg' | 'icon'

export interface ButtonProps extends Omit<ButtonRootProps, 'variant' | 'size'> {
  variant?: LegacyVariant | ButtonRootProps['variant']
  size?: LegacySize | ButtonRootProps['size']
  loading?: boolean
  isLoading?: boolean
  asChild?: boolean
}

const legacyVariantMap: Record<LegacyVariant, ButtonRootProps['variant']> = {
  default:     'primary',
  destructive: 'danger',
  outline:     'outline',
  secondary:   'secondary',
  ghost:       'ghost',
  link:        'ghost',
}

const legacySizeMap: Record<LegacySize, ButtonRootProps['size']> = {
  default: 'md',
  sm:      'sm',
  lg:      'lg',
  icon:    'sm',
}

const isLegacyVariant = (v: string): v is LegacyVariant =>
  ['default','destructive','outline','secondary','ghost','link'].includes(v)

const isLegacySize = (s: string): s is LegacySize =>
  ['default','sm','lg','icon'].includes(s)

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ({ variant = 'default', size = 'default', loading, isLoading, asChild: _asChild, children, ...props }, ref) => {
    const heroVariant = typeof variant === 'string' && isLegacyVariant(variant)
      ? legacyVariantMap[variant]
      : (variant as ButtonRootProps['variant'])

    const heroSize = typeof size === 'string' && isLegacySize(size)
      ? legacySizeMap[size]
      : (size as ButtonRootProps['size'])

    const busy = loading || isLoading

    return (
      <HeroButton
        ref={ref}
        variant={heroVariant}
        size={heroSize}
        isDisabled={props.isDisabled || busy}
        isIconOnly={size === 'icon'}
        {...props}
      >
        {busy
          ? <>
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              {children}
            </>
          : <>{children}</>
        }
      </HeroButton>
    )
  }
)
Button.displayName = "Button"

export { Button }
// eslint-disable-next-line react-refresh/only-export-components
export const buttonVariants = () => ''
