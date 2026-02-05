import { Link, useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { api } from '../services/api'

export function ClientPaymentPage() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    // Check authentication first - payment requires login
    if (!api.isAuthenticated()) {
      navigate(`/login?redirect=/client/${projectId}/payment`)
      return
    }

    if (projectId) {
      loadProject()
    }
  }, [projectId, navigate])

  const loadProject = async () => {
    try {
      setLoading(true)
      const response: any = await api.getProjectDetails(projectId!)
      if (response.success) {
        setProject(response.data.project)
      }
    } catch (error) {
      console.error('Failed to load project:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAmount = () => {
    if (!project) return 0
    if (project.custom_quote_amount) {
      return project.custom_quote_amount
    }
    if (project.selected_service && typeof project.selected_service === 'object') {
      return project.selected_service.price || 0
    }
    return 0
  }

  const getServiceName = () => {
    if (!project) return 'Service'
    if (project.custom_quote_amount) {
      return 'Custom Quote'
    }
    if (project.selected_service && typeof project.selected_service === 'object') {
      return project.selected_service.name || 'Service'
    }
    return 'Service'
  }

  const handleCheckout = async () => {
    if (!projectId || !project) return

    setProcessing(true)
    try {
      const amount = getAmount()
      const serviceId = project.selected_service?._id || project.selected_service
      const customAmount = project.custom_quote_amount

      const response: any = await api.createCheckoutSession(projectId, {
        serviceId: serviceId || undefined,
        customAmount: customAmount || undefined,
      })

      if (response.success && response.data.url) {
        // Redirect to Stripe Checkout
        window.location.href = response.data.url
      } else {
        alert('Failed to create checkout session. Please try again.')
        setProcessing(false)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
      setProcessing(false)
    }
  }

  if (loading) {
    return (
      <section className="page">
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Loading payment details...</p>
        </div>
      </section>
    )
  }

  const amount = getAmount()
  const serviceName = getServiceName()

  return (
    <section className="page">
      <header className="page-header">
        <div className="page-kicker">Step 3 of 4</div>
        <h1 className="page-title">Secure Payment</h1>
        <p className="page-subtitle">
          Complete your payment securely via Stripe. Your project will begin once payment is confirmed.
        </p>
      </header>

      <div className="page-body">
        <div className="page-panel">
          <h3 style={{ fontSize: '1.1rem', marginBottom: '1.2rem', color: '#0f172a' }}>
            Payment Summary
          </h3>

          <div style={{
            background: 'rgba(30, 64, 175, 0.1)',
            padding: '1.2rem',
            borderRadius: '0.6rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(30, 64, 175, 0.3)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
              <span style={{ color: '#6b7280' }}>Service:</span>
              <span style={{ color: '#0f172a', fontWeight: '500' }}>{serviceName}</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              paddingTop: '0.8rem',
              borderTop: '1px solid rgba(30, 64, 175, 0.3)',
              fontSize: '1.2rem',
              fontWeight: '600'
            }}>
              <span style={{ color: '#0f172a' }}>Total:</span>
              <span style={{ color: '#1d4ed8' }}>${amount.toLocaleString()}</span>
            </div>
          </div>

          <div style={{
            background: 'rgba(34, 197, 94, 0.1)',
            padding: '1rem',
            borderRadius: '0.6rem',
            border: '1px solid rgba(34, 197, 94, 0.3)',
            marginBottom: '1.5rem'
          }}>
            <p style={{ margin: 0, fontSize: '0.85rem', color: '#15803d' }}>
              <strong>🔒 Secure Payment:</strong> Your payment is processed securely through Stripe. 
              We never store your card details.
            </p>
          </div>

          <button
            onClick={handleCheckout}
            disabled={processing || amount === 0}
            style={{
              width: '100%',
              padding: '1rem',
              background: processing || amount === 0 ? 'rgba(29, 78, 216, 0.3)' : '#1d4ed8',
              color: '#ffffff',
              border: 'none',
              borderRadius: '0.6rem',
              fontWeight: '600',
              fontSize: '1rem',
              cursor: processing || amount === 0 ? 'not-allowed' : 'pointer',
              boxShadow: processing || amount === 0 ? 'none' : '0 8px 20px rgba(29, 78, 216, 0.4)'
            }}
          >
            {processing ? 'Processing...' : `Pay $${amount.toLocaleString()} with Stripe`}
          </button>
        </div>

        <aside className="page-sidebar">
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#0f172a' }}>
            What happens next?
          </h3>
          <div style={{ fontSize: '0.85rem', lineHeight: '1.8', color: '#4b5563' }}>
            <div style={{ marginBottom: '0.8rem' }}>
              <strong style={{ color: '#0f172a' }}>1. Payment Processing</strong>
              <p style={{ margin: '0.3rem 0 0', color: '#6b7280' }}>
                You'll be redirected to Stripe's secure checkout page.
              </p>
            </div>
            <div style={{ marginBottom: '0.8rem' }}>
              <strong style={{ color: '#0f172a' }}>2. Confirmation</strong>
              <p style={{ margin: '0.3rem 0 0', color: '#6b7280' }}>
                Once payment is confirmed, you'll receive an email with your dashboard link.
              </p>
            </div>
            <div>
              <strong style={{ color: '#0f172a' }}>3. Project Start</strong>
              <p style={{ margin: '0.3rem 0 0', color: '#6b7280' }}>
                Your project will be activated and you can track progress in your dashboard.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  )
}
