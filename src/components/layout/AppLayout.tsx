import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DisclaimerBanner } from './DisclaimerBanner'
import { Footer } from './Footer'
import { Navbar } from './Navbar'
import { Sidebar } from './Sidebar'

function AnimatedOutlet() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  )
}

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <TooltipProvider>
      <div className="flex min-h-svh flex-col">
        <DisclaimerBanner />
        <Navbar onMenu={() => setSidebarOpen((s) => !s)} />
        <div className="mx-auto flex w-full max-w-7xl flex-1">
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <main className="flex min-w-0 flex-1 flex-col">
            <AnimatedOutlet />
          </main>
        </div>
        <Footer />
      </div>
    </TooltipProvider>
  )
}
