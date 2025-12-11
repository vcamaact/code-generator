'use client'

import { useState } from 'react'

export default function RegisterForm() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Registering:', formData)
  }

  return (
    <div className="p-8 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-center">User Registration</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col items-center">
          <label className="block mb-1 w-full text-left">Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="flex flex-col items-center">
          <label className="block mb-1 w-full text-left">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="flex flex-col items-center">
          <label className="block mb-1 w-full text-left">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full p-2 border rounded"
          />
        </div>
        <div className="flex justify-center">
          <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
            Register
          </button>
        </div>
      </form>
    </div>
  )
}