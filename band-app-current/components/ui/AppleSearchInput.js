const AppleSearchInput = ({ 
  placeholder = "Search...", 
  value, 
  onChange, 
  className = "" 
}) => (
  <div className={`relative ${className}`}>
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full px-4 py-3 pl-10 bg-white border border-gray-200 rounded-apple-small text-apple-body transition-apple-fast focus:outline-none focus:ring-2 focus:ring-blue focus:border-transparent"
    />
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
  </div>
);

export default AppleSearchInput; 