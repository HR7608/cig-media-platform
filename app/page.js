import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
      <h1 className="text-4xl font-bold mb-4">CIG Media Platform</h1>
      <p className="text-gray-400 mb-8">Your club's central media hub</p>
      <div className="flex gap-4">
        <Link href="/login" className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium">
          Login
        </Link>
        <Link href="/signup" className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg font-medium">
          Sign Up
        </Link>
      </div>
    </main>
  )
}