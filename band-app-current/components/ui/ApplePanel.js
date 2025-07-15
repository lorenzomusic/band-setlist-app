const ApplePanel = ({ children, className = "" }) => (
  <div className={`bg-white rounded-apple shadow-apple overflow-hidden ${className}`}>
    {children}
  </div>
);

export default ApplePanel; 