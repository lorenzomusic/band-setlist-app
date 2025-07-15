const ApplePanelHeader = ({ title, subtitle }) => (
  <div className="px-8 pt-8 pb-6 border-b border-light bg-gradient-to-b from-gray-50 to-white">
    <h1 className="text-apple-title-1 text-primary mb-1">{title}</h1>
    <p className="text-apple-body text-secondary">{subtitle}</p>
  </div>
);

export default ApplePanelHeader; 