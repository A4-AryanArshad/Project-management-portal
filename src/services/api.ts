// Hardcoded backend API base URL (Vercel deployment)
// If VITE_API_URL is set, it will override this; otherwise it uses the deployed backend.
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://internal-backend-001-qdoi.vercel.app/api'

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('auth_token')
  }

  private setToken(token: string) {
    localStorage.setItem('auth_token', token)
  }

  private removeToken() {
    localStorage.removeItem('auth_token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`
    const token = this.getToken()
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }))
      throw new Error(error.message || 'Request failed')
    }

    return response.json()
  }

  // Auth endpoints
  async signup(data: { name: string; email: string; password: string }) {
    const response = await this.request<{ success: boolean; data: { user: any; token: string } }>('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (response.success && response.data.token) {
      this.setToken(response.data.token)
      // Store user data
      if (response.data.user) {
        localStorage.setItem('user_data', JSON.stringify(response.data.user))
      }
    }
    return response
  }

  async login(data: { email: string; password: string }) {
    const response = await this.request<{ success: boolean; data: { user: any; token: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
    if (response.success && response.data.token) {
      this.setToken(response.data.token)
      // Store user data
      if (response.data.user) {
        localStorage.setItem('user_data', JSON.stringify(response.data.user))
      }
    }
    return response
  }

  async getCurrentUser() {
    return this.request('/auth/me')
  }

  logout() {
    this.removeToken()
    localStorage.removeItem('user_data')
  }

  isAuthenticated(): boolean {
    return !!this.getToken()
  }

  // Project endpoints
  async getProject(projectId: string) {
    return this.request(`/projects/${projectId}`)
  }

  async getProjectDetails(projectId: string) {
    return this.request(`/projects/${projectId}/details`)
  }

  async updateServiceSelection(projectId: string, data: { serviceId?: string; customAmount?: number }) {
    return this.request(`/projects/${projectId}/service`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getClientProjects(clientEmail: string) {
    return this.request(`/projects/client/${encodeURIComponent(clientEmail)}`)
  }

  async getSimpleProjects() {
    return this.request('/projects/simple')
  }

  async getMyProjects() {
    return this.request('/projects/my-projects')
  }

  // Service endpoints
  async getServices() {
    return this.request(`/services`)
  }

  async getService(serviceId: string) {
    return this.request(`/services/${serviceId}`)
  }

  // Payment endpoints
  async createCheckoutSession(projectId: string, data: { serviceId?: string; customAmount?: number }) {
    return this.request(`/payments/${projectId}/checkout`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async handlePaymentSuccess(projectId: string, sessionId: string) {
    return this.request(`/payments/${projectId}/success?session_id=${sessionId}`)
  }

  // Briefing endpoints
  async getBriefing(projectId: string) {
    return this.request(`/briefings/${projectId}`)
  }

  async submitBriefing(projectId: string, data: { overall_description: string; images: Array<{ url: string; notes: string }> }) {
    return this.request(`/briefings/${projectId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Upload endpoint
  async uploadImage(projectId: string, file: File): Promise<{ data: { url: string; path: string } }> {
    const formData = new FormData()
    formData.append('image', file)
    const token = this.getToken()

    const response = await fetch(`${API_BASE_URL}/upload/${projectId}/image`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }))
      throw new Error(error.message || 'Upload failed')
    }

    return response.json()
  }

  // Custom quote endpoints
  async requestStandaloneQuote(data: { description?: string; estimated_budget?: number; preferred_timeline?: string }) {
    return this.request('/custom-quotes/request', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async requestCustomQuote(projectId: string, data: { description?: string; estimated_budget?: number; preferred_timeline?: string }) {
    return this.request(`/custom-quotes/${projectId}/request`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getCustomQuote(projectId: string) {
    return this.request(`/custom-quotes/${projectId}`)
  }

  async acceptCustomQuote(quoteId: string) {
    return this.request(`/custom-quotes/${quoteId}/accept`, {
      method: 'POST',
    })
  }

  async sendCustomQuote(quoteId: string, data: { amount: number; delivery_timeline?: string; admin_notes?: string }) {
    return this.request(`/custom-quotes/${quoteId}/send`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getAllPendingQuotes() {
    return this.request('/custom-quotes/admin/pending')
  }

  // Collaborator endpoints
  async getCollaborators() {
    return this.request('/collaborators')
  }

  async getCollaborator(collaboratorId: string) {
    return this.request(`/collaborators/${collaboratorId}`)
  }

  async createCollaborator(data: { first_name: string; last_name: string; email: string; password: string }) {
    return this.request('/collaborators', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateCollaborator(collaboratorId: string, data: { first_name: string; last_name: string }) {
    return this.request(`/collaborators/${collaboratorId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async deleteCollaborator(collaboratorId: string) {
    return this.request(`/collaborators/${collaboratorId}`, {
      method: 'DELETE',
    })
  }

  async getCollaboratorProjects(collaboratorId: string) {
    return this.request(`/collaborators/${collaboratorId}/projects`)
  }

  async getMyCollaboratorProjects() {
    return this.request('/collaborators/me/projects')
  }

  // Collaborator Stripe Connect
  async getCollaboratorStripeStatus() {
    return this.request('/collaborators/me/stripe/status')
  }

  async createCollaboratorStripeLink() {
    return this.request('/collaborators/me/stripe/connect', {
      method: 'POST',
    })
  }

  async disconnectCollaboratorStripe() {
    return this.request('/collaborators/me/stripe/disconnect', {
      method: 'DELETE',
    })
  }

  async claimCollaboratorEarnings(projectId: string) {
    return this.request(`/payments/${projectId}/claim-earnings`, {
      method: 'POST',
    })
  }

  async assignCollaborator(projectId: string, data: { collaborator_id: string; payment_amount: number }) {
    return this.request(`/projects/${projectId}/assign-collaborator`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async unassignCollaborator(projectId: string) {
    return this.request(`/projects/${projectId}/unassign-collaborator`, {
      method: 'POST',
    })
  }

  async claimRevision(projectId: string, description?: string) {
    return this.request(`/projects/${projectId}/claim-revision`, {
      method: 'POST',
      body: JSON.stringify({ description }),
    })
  }

  // Invoice endpoints
  async uploadInvoice(projectId: string, file: File): Promise<{ data: { url: string; public_id: string } }> {
    const formData = new FormData()
    formData.append('invoice', file)
    const token = this.getToken()

    const response = await fetch(`${API_BASE_URL}/upload/${projectId}/invoice`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }))
      throw new Error(error.message || 'Upload failed')
    }

    return response.json()
  }

  async approveInvoice(projectId: string) {
    return this.request(`/projects/${projectId}/invoice/approve`, {
      method: 'POST',
    })
  }

  async rejectInvoice(projectId: string) {
    return this.request(`/projects/${projectId}/invoice/reject`, {
      method: 'POST',
    })
  }

  // Pay collaborator for a project invoice (project-based)
  async payCollaboratorForProject(projectId: string) {
    return this.request(`/payments/${projectId}/pay-collaborator`, {
      method: 'POST',
    })
  }

  // Pay collaborator for monthly invoice (monthly-based)
  async payCollaboratorForMonthlyInvoice(projectId: string) {
    return this.request(`/payments/${projectId}/pay-collaborator-monthly`, {
      method: 'POST',
    })
  }

  // Invoice type management
  async updateInvoiceType(invoiceType: 'per-project' | 'monthly') {
    return this.request('/collaborators/me/invoice-type', {
      method: 'PUT',
      body: JSON.stringify({ invoice_type: invoiceType }),
    })
  }

  async getMonthlyInvoiceProjects(month: string) {
    return this.request(`/collaborators/me/monthly-invoice-projects?month=${encodeURIComponent(month)}`)
  }

  async uploadMonthlyInvoice(month: string, file: File): Promise<{ data: { url: string; public_id: string; monthly_invoice_id: string; month: string; projects_count: number; total_amount: number } }> {
    const formData = new FormData()
    formData.append('invoice', file)
    formData.append('month', month)
    const token = this.getToken()

    const response = await fetch(`${API_BASE_URL}/upload/monthly-invoice`, {
      method: 'POST',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }))
      throw new Error(error.message || 'Upload failed')
    }

    return response.json()
  }

  // Monthly invoices (admin)
  async getMonthlyInvoices() {
    return this.request('/projects/invoices/monthly')
  }
}

export const api = new ApiService()

