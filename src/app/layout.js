import './globals.css'
import { Inter, Playfair_Display } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' })

export const metadata = {
  title: 'AELLYNA | Premium Bakery & Beverages',
  description: 'Elevating the Art of Pastry & Beverage.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.variable} ${playfair.variable} font-sans selection:bg-brand-wine selection:text-white`}>
        {children}
      </body>
    </html>
  )
}