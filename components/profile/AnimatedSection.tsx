'use client'

import { useRef } from 'react'
import { motion, useInView, type Variants } from 'framer-motion'

interface VariantDef {
  hidden: object
  visible: object & { transition?: object }
}

interface AnimatedSectionProps {
  children: React.ReactNode
  variants: VariantDef
  delay?: number
}

export default function AnimatedSection({ children, variants: v, delay = 0 }: AnimatedSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })

  const isEmpty = Object.keys(v.hidden).length === 0

  if (isEmpty) {
    return <div>{children}</div>
  }

  const motionVariants: Variants = {
    hidden: v.hidden as Variants['hidden'],
    visible: {
      ...(v.visible as object),
      transition: {
        ...((v.visible as { transition?: object }).transition ?? {}),
        delay,
      },
    } as Variants['visible'],
  }

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={motionVariants}
    >
      {children}
    </motion.div>
  )
}
