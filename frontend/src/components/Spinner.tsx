export default function Spinner() {
  return (
    <div className="flex justify-center items-center py-8" role="status">
      <div className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-blue-600 rounded-full" />
      <span className="sr-only">Loading...</span>
    </div>
  );
}
