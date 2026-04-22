import Image from 'next/image'

interface LogoProps {
  /** Anzeigevariante */
  variant?: 'sidebar' | 'login' | 'hero' | 'header'
  /** Zusätzliche CSS-Klassen für das Wrapper-Element */
  className?: string
}

const sizes: Record<NonNullable<LogoProps['variant']>, { width: number; height: number; maxH: string }> = {
  sidebar: { width: 120, height: 40,  maxH: 'max-h-8'  },
  header:  { width: 140, height: 44,  maxH: 'max-h-9'  },
  login:   { width: 180, height: 60,  maxH: 'max-h-14' },
  hero:    { width: 220, height: 72,  maxH: 'max-h-16' },
}

export default function Logo({ variant = 'header', className = '' }: LogoProps) {
  const { width, height, maxH } = sizes[variant]

  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <Image
        src="/logo.png"
        alt="Edelzaun & Tor – Logo"
        width={width}
        height={height}
        priority
        className={`w-auto ${maxH} object-contain`}
        style={{ filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.5))' }}
      />
    </div>
  )
}
