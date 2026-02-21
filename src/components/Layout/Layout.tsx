import type { ReactNode } from 'react'
import Header from './Header'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-sm text-gray-500">
        <p>Ten Baht Ride &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  )
}
