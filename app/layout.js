import AppleLayout from '../components/AppleLayout';
import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <AppleLayout>
          {children}
        </AppleLayout>
      </body>
    </html>
  );
}
