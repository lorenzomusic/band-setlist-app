const AppleMetadataBadge = ({ children, type = "default" }) => {
  const typeClasses = {
    default: "bg-gray-100 text-gray-700",
    duration: "bg-blue-100 text-blue-700",
    language: "bg-green-100 text-green-700",
    vocalist: "bg-purple-100 text-purple-700",
    sets: "bg-orange-100 text-orange-700",
    songs: "bg-indigo-100 text-indigo-700",
    audience: "bg-pink-100 text-pink-700",
    rating: "bg-yellow-100 text-yellow-700",
    date: "bg-gray-100 text-gray-700"
  };

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${typeClasses[type]}`}>
      {children}
    </span>
  );
};

export default AppleMetadataBadge; 