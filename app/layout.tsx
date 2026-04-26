import type { Metadata } from 'next'
import {
  Inter,
  Playfair_Display,
  Space_Mono,
  Nunito,
  Lora,
} from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })
const spaceMono = Space_Mono({ subsets: ['latin'], weight: ['400', '700'], variable: '--font-mono' })
const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' })
const lora = Lora({ subsets: ['latin'], variable: '--font-lora' })

export const metadata: Metadata = {
  title: { default: 'MyBrain', template: '%s · MyBrain' },
  description: 'Your personal hub — links, projects, ideas, and more.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${playfair.variable} ${spaceMono.variable} ${nunito.variable} ${lora.variable} font-inter antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
