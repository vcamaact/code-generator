'use client'

import { useState } from 'react'

export default function Home() {
  const [formData, setFormData] = useState({
    title: '',
    prompt: '',
    targetFile: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      console.log('Success:', data)
      alert(`Success! Branch created: ${data.data.branchName}`)

    } catch (error: any) {
      console.error('Error:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="container">
      <div className="content">
        <div className="header">
          <h1>Code Generator</h1>
          <p className="subtitle">
            Describe the changes you want to make to your software
          </p>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <div className="form-group">
            <label htmlFor="title">
              Feature Title <span className="optional">(optional)</span>
              <br />
              <span className="text-sm text-gray-500">Enter a descriptive title for your feature</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="E.g: Add user authentication"
              className="input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="targetFile">
              Target File <span className="optional">(optional, default: app/page.tsx)</span>
            </label>
            <input
              type="text"
              id="targetFile"
              name="targetFile"
              value={formData.targetFile}
              onChange={handleChange}
              placeholder="E.g: app/test-form/page.tsx"
              className="input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="prompt">
              Feature Description <span className="required">*</span>
            </label>
            <textarea
              id="prompt"
              name="prompt"
              value={formData.prompt}
              onChange={handleChange}
              placeholder="Describe in detail the changes you want to make. Be specific about functionalities, features, technologies to use, etc."
              className="textarea"
              rows={10}
              required
            />
            <div className="char-count">
              {formData.prompt.length} characters
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => setFormData({ title: '', prompt: '', targetFile: '' })}
              className="btn btn-secondary"
              disabled={isSubmitting}
            >
              Clear
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || !formData.prompt.trim()}
            >
              {isSubmitting ? 'Processing...' : 'Generate Code'}
            </button>
          </div>
        </form>

        {formData.prompt && (
          <div className="preview">
            <h3>Preview</h3>
            <div className="preview-content">
              {formData.title && (
                <div className="preview-item">
                  <strong>Feature Title:</strong> {formData.title}
                </div>
              )}
              <div className="preview-item">
                <strong>Requested Changes:</strong>
                <p>{formData.prompt}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
