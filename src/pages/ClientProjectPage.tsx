import { Link, useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { api } from '../services/api'

export function ClientProjectPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check authentication first
    if (!api.isAuthenticated()) {
      navigate(`/login?redirect=/client/${projectId}`)
      return
    }

    if (projectId) {
      loadProject()
    } else {
      setError('No project ID provided')
      setLoading(false)
    }
  }, [projectId, navigate])

  const loadProject = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getProject(projectId!)
      if (response.success) {
        const projectData = response.data
        setProject(projectData)

        // If the project is already paid, send the client straight to their dashboard
        if (projectData.payment_status === 'paid') {
          navigate(`/client/${projectId}/dashboard`)
          return
        }

        // For simple projects, allow access without authentication
        // For custom projects, require authentication (safety check, though we already enforced auth above)
        if (projectData.project_type === 'custom' && !api.isAuthenticated()) {
          navigate(`/signup?projectId=${projectId}`)
          return
        }
      } else {
        setError('Project not found')
      }
    } catch (err: any) {
      console.error('Error loading project:', err)
      setError(err.message || 'Failed to load project. Make sure the backend is running on http://localhost:3001')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading project...</p>
          <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.5rem' }}>
            {projectId ? `Fetching project: ${projectId}` : 'No project ID'}
          </p>
        </div>
      </section>
    )
  }

  if (error || !project) {
    return (
      <section className="page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <h2>Project Not Found</h2>
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>
            {error || 'The project link is invalid or has expired.'}
          </p>
          {projectId && (
            <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '0.5rem' }}>
              Project ID: {projectId}
            </p>
          )}
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '1rem' }}>
            Make sure the backend server is running on http://localhost:3001
          </p>
        </div>
      </section>
    )
  }

  return (
    <section className="page">
      <header className="page-header">
        <div className="page-kicker">Welcome</div>
        <h1 className="page-title">{project.name}</h1>
        <p className="page-subtitle">
          Thank you for choosing our services. Let's get started by selecting your service package and
          submitting your design brief.
        </p>
      </header>

      <div className="page-body">
        <div className="page-panel">
          <div className="badge-row">
            <span className="badge" style={{ background: 'rgba(29, 78, 216, 0.1)', borderColor: 'rgba(29, 78, 216, 0.3)' }}>
              Project #{project._id ? project._id.toString().slice(0, 8) : project.id?.slice(0, 8) || 'N/A'}
            </span>
            <span className="badge">Client: {project.client_name}</span>
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <h3 style={{ fontSize: '1.1rem', marginBottom: '0.8rem', color: '#0f172a' }}>
              Project Overview
            </h3>
            <p style={{ color: '#4b5563', lineHeight: '1.6', marginBottom: '1.2rem' }}>
              We're excited to work with you on this project. Please select your service package or confirm your custom quote.
            </p>

            {/* Show client's original description for custom projects */}
            {project?.project_type === 'custom' && project?.custom_quote_request && typeof project.custom_quote_request === 'object' && project.custom_quote_request.description && (
              <div style={{
                marginBottom: '1.2rem',
                padding: '1rem',
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '0.6rem'
              }}>
                <h4 style={{ 
                  margin: '0 0 0.5rem', 
                  fontSize: '0.9rem', 
                  color: '#1e40af',
                  fontWeight: '600'
                }}>
                  Your Request:
                </h4>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.85rem', 
                  color: '#4b5563', 
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}>
                  {project.custom_quote_request.description}
                </p>
              </div>
            )}

            {/* Show admin's description if available */}
            {project?.custom_quote_description && (
              <div style={{
                marginBottom: '1.2rem',
                padding: '1rem',
                background: 'rgba(29, 78, 216, 0.05)',
                border: '1px solid rgba(29, 78, 216, 0.2)',
                borderRadius: '0.6rem'
              }}>
                <h4 style={{ 
                  margin: '0 0 0.5rem', 
                  fontSize: '0.9rem', 
                  color: '#1d4ed8',
                  fontWeight: '600'
                }}>
                  Quote Details:
                </h4>
                <p style={{ 
                  margin: 0, 
                  fontSize: '0.85rem', 
                  color: '#4b5563', 
                  lineHeight: '1.6',
                  whiteSpace: 'pre-wrap'
                }}>
                  {project.custom_quote_description}
                </p>
              </div>
            )}

            <div style={{ 
              background: 'rgba(30, 64, 175, 0.2)', 
              padding: '1rem', 
              borderRadius: '0.6rem',
              border: '1px solid rgba(30, 64, 175, 0.4)',
              marginBottom: '1.5rem'
            }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#1d4ed8' }}>
                <strong>Next Step:</strong> Select your service package or confirm your custom quote
              </p>
            </div>

            {!api.isAuthenticated() ? (
              <div>
                <div style={{ 
                  background: 'rgba(239, 68, 68, 0.1)', 
                  padding: '1rem', 
                  borderRadius: '0.6rem',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  marginBottom: '1rem'
                }}>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#dc2626' }}>
                    <strong>⚠️ Login Required:</strong> You must be logged in to purchase this project.
                  </p>
                </div>
                <Link 
                  to={`/login?redirect=/client/${projectId}`}
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.8rem',
                    background: '#1d4ed8',
                    color: '#ffffff',
                    borderRadius: '999px',
                    textDecoration: 'none',
                    fontWeight: '500',
                    fontSize: '0.9rem',
                    boxShadow: '0 8px 20px rgba(29, 78, 216, 0.4)'
                  }}
                >
                  Login to Continue →
                </Link>
              </div>
            ) : (
              <Link 
                to={`/client/${projectId}/service`}
                style={{
                  display: 'inline-block',
                  padding: '0.75rem 1.8rem',
                  background: '#1d4ed8',
                  color: '#ffffff',
                  borderRadius: '999px',
                  textDecoration: 'none',
                  fontWeight: '500',
                  fontSize: '0.9rem',
                  boxShadow: '0 8px 20px rgba(29, 78, 216, 0.4)'
                }}
              >
                Continue to Service Selection →
              </Link>
            )}
          </div>
        </div>

        <aside className="page-sidebar">
          <strong style={{ display: 'block', marginBottom: '0.6rem', color: '#0f172a' }}>Project Timeline</strong>
          <div style={{ fontSize: '0.85rem', lineHeight: '1.8', color: '#0f172a' }}>
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ color: '#1d4ed8' }}>●</span> <span style={{ color: '#0f172a' }}>Service Selection</span>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>○</span> <span style={{ color: '#4b5563' }}>Payment</span>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>○</span> <span style={{ color: '#4b5563' }}>Briefing Submission</span>
            </div>
            <div style={{ marginBottom: '0.5rem' }}>
              <span style={{ color: '#64748b' }}>○</span> <span style={{ color: '#4b5563' }}>Project In Progress</span>
            </div>
            <div>
              <span style={{ color: '#64748b' }}>○</span> <span style={{ color: '#4b5563' }}>Delivery</span>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
