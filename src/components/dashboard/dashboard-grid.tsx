"use client"

import { motion } from "framer-motion"
import { ReactNode, Children, isValidElement, cloneElement } from "react"

interface DashboardGridProps {
  children: ReactNode
  className?: string
}

export function DashboardGrid({ children, className }: DashboardGridProps) {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      className={className}
      variants={container}
      initial="hidden"
      animate="show"
    >
      {Children.map(children, (child, index) => {
        // Extract className from child if it exists
        const childProps = isValidElement(child) ? (child.props as { className?: string }) : {}
        const childClassName = childProps.className || ''

        return (
          <motion.div key={index} variants={item} className={childClassName}>
            {isValidElement(child)
              ? cloneElement(child, { className: 'h-full w-full' } as any)
              : child
            }
          </motion.div>
        )
      })}
    </motion.div>
  )
}

