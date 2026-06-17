import { useEffect, useRef, useState } from 'react'

interface Props {
  children: React.ReactNode
  delay?: number
  className?: string
}

export default function Highlighter({ children, delay = 0, className = '' }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const [lit, setLit] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setLit(true), delay)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [delay])

  return (
    <span ref={ref} className={`hl${lit ? ' lit' : ''}${className ? ' ' + className : ''}`}>
      {children}
    </span>
  )
}
