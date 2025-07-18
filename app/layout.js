import './globals.css'
import AppleLayout from '../components/AppleLayout'
import { AuthProvider } from '../components/AuthProvider'

export const metadata = {
  title: 'Greatest Gig - Band Management',
  description: 'Professional setlist and gig management for Greatest Hit',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AppleLayout>
            {children}
          </AppleLayout>
        </AuthProvider>
      </body>
    </html>
  )
}
