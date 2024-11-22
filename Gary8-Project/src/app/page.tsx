export default function Home() {
  return (
    <main className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-6">
            Welcome to Gary8 Project
          </h1>
          <p className="text-lg text-gray-600 mb-4">
            A Next.js application with Firebase integration and advanced features.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-900 mb-3">
                Features
              </h2>
              <ul className="space-y-2 text-blue-800">
                <li>• Next.js 14 with App Router</li>
                <li>• Firebase Integration</li>
                <li>• Tailwind CSS Styling</li>
                <li>• TypeScript Support</li>
              </ul>
            </div>
            <div className="bg-green-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-green-900 mb-3">
                Getting Started
              </h2>
              <p className="text-green-800">
                Explore the features and start building your application with our
                modern tech stack.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
