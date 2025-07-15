const AppleButton = ({ 
  children, 
  variant = "primary", 
  size = "md", 
  className = "", 
  disabled = false,
  type = "button",
  onClick,
  ...props 
}) => {
  const baseClasses = "font-medium transition-apple-fast focus:outline-none focus:ring-2 focus:ring-blue focus:ring-offset-2";
  
  const variantClasses = {
    primary: "bg-blue text-white hover:bg-blue-600 active:bg-blue-700",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300",
    danger: "bg-red-500 text-white hover:bg-red-600 active:bg-red-700"
  };
  
  const sizeClasses = {
    sm: "px-4 py-2 text-apple-callout rounded-apple-button",
    md: "px-6 py-3 text-apple-body rounded-apple-button",
    lg: "px-8 py-4 text-apple-headline rounded-apple-button"
  };
  
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "";
  
  return (
    <button
      type={type}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default AppleButton; 