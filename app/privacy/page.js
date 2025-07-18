export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
      <div className="prose prose-gray max-w-none">
        
        <p className="text-gray-600 mb-6">
          <strong>Last updated:</strong> {new Date().toLocaleDateString()}
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">1. Information We Collect</h2>
        <p>Greatest Gig collects and processes the following types of information:</p>
        <ul>
          <li><strong>Song Data:</strong> Information about songs you add (title, artist, key, duration, etc.)</li>
          <li><strong>Setlist Data:</strong> Your setlists, gigs, and performance information</li>
          <li><strong>Spotify Data:</strong> When you connect your Spotify account, we access:
            <ul>
              <li>Your Spotify user profile (ID, display name, email)</li>
              <li>Ability to search for songs on Spotify</li>
              <li>Ability to create playlists in your Spotify account</li>
            </ul>
          </li>
          <li><strong>Authentication Data:</strong> Login credentials and session information</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">2. How We Use Your Information</h2>
        <p>We use your information to:</p>
        <ul>
          <li>Provide the core setlist management functionality</li>
          <li>Search for songs on Spotify and create playlists</li>
          <li>Maintain your account and authenticate access</li>
          <li>Improve our service and user experience</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">3. Spotify Integration</h2>
        <p>When you connect your Spotify account:</p>
        <ul>
          <li>We use the official Spotify Web API in compliance with Spotify's Developer Terms</li>
          <li>We only request the minimum permissions necessary for functionality</li>
          <li>We do not store Spotify music content or audio files</li>
          <li>We do not use Spotify data for commercial purposes or advertising</li>
          <li>You can disconnect your Spotify account at any time</li>
          <li>Spotify is not responsible for this third-party application</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">4. Data Storage and Security</h2>
        <p>Your data is stored securely using:</p>
        <ul>
          <li>Industry-standard encryption for sensitive information</li>
          <li>Secure cloud infrastructure (Upstash Redis)</li>
          <li>HTTPS encryption for all data transmission</li>
          <li>Regular security updates and monitoring</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">5. Data Sharing and Third Parties</h2>
        <p>We do not sell, trade, or share your personal information with third parties except:</p>
        <ul>
          <li>With Spotify, when you explicitly connect your account</li>
          <li>With trusted service providers who help operate our service</li>
          <li>When required by law or to protect our legal rights</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">6. Your Rights and Choices</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access, update, or delete your account data</li>
          <li>Disconnect your Spotify account at any time</li>
          <li>Export your setlist data</li>
          <li>Request deletion of your account and all associated data</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">7. Cookies and Tracking</h2>
        <p>We use:</p>
        <ul>
          <li>Essential cookies for authentication and session management</li>
          <li>No third-party advertising or tracking cookies</li>
          <li>Local storage for application preferences</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">8. Data Retention</h2>
        <p>We retain your data:</p>
        <ul>
          <li>As long as your account is active</li>
          <li>For up to 30 days after account deletion for backup purposes</li>
          <li>Spotify authentication tokens are refreshed automatically and expire as per Spotify's terms</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8 mb-4">9. Changes to This Policy</h2>
        <p>
          We may update this privacy policy from time to time. We will notify you of any material 
          changes by posting the new policy on this page and updating the "Last updated" date.
        </p>

        <h2 className="text-2xl font-semibold mt-8 mb-4">10. Contact Us</h2>
        <p>
          If you have any questions about this privacy policy or your data, please contact us 
          through the application's feedback feature or at the contact information provided in the app.
        </p>

        <div className="bg-gray-100 p-4 rounded-lg mt-8">
          <h3 className="font-semibold mb-2">Spotify-Specific Disclaimers:</h3>
          <ul className="text-sm space-y-1">
            <li>• This application is not affiliated with, endorsed, or sponsored by Spotify AB</li>
            <li>• Spotify is a third-party beneficiary with rights to enforce these terms</li>
            <li>• No warranties are made on behalf of Spotify regarding this application</li>
            <li>• Spotify disclaims all liability for this third-party application</li>
          </ul>
        </div>

      </div>
    </div>
  );
} 