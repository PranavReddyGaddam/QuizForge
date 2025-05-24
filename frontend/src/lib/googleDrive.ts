// Google Drive API Integration
// This module handles Google Drive authentication and file operations

interface GoogleDriveFile {
  id: string
  name: string
  mimeType: string
  size?: string
  modifiedTime: string
  webViewLink: string
}

// Type declarations for Google API
interface GoogleAPI {
  load: (api: string, callback?: () => void) => void
  auth2: {
    init: (config: { client_id: string }) => void
    getAuthInstance: () => {
      signIn: (options: { scope: string }) => Promise<{
        getAuthResponse: () => { access_token: string }
      }>
      signOut: () => Promise<void>
    }
  }
}

declare global {
  interface Window {
    gapi: GoogleAPI
  }
  const gapi: GoogleAPI
}

class GoogleDriveService {
  private clientId: string
  private apiKey: string
  private accessToken: string | null = null

  constructor() {
    // These would come from environment variables
    this.clientId = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_CLIENT_ID || ''
    this.apiKey = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_API_KEY || ''
  }

  // Initialize Google API and authenticate
  async authenticate(): Promise<boolean> {
    try {
      // Load Google API scripts
      await this.loadGoogleAPI()
      
      // Initialize the API
      await gapi.load('auth2', () => {
        gapi.auth2.init({
          client_id: this.clientId,
        })
      })

      // Sign in
      const authInstance = gapi.auth2.getAuthInstance()
      const user = await authInstance.signIn({
        scope: 'https://www.googleapis.com/auth/drive.readonly'
      })

      this.accessToken = user.getAuthResponse().access_token
      return true
    } catch (error) {
      console.error('Google Drive authentication failed:', error)
      return false
    }
  }

  // Load Google API scripts dynamically
  private loadGoogleAPI(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof gapi !== 'undefined') {
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'https://apis.google.com/js/api.js'
      script.onload = () => {
        gapi.load('client:auth2', resolve)
      }
      script.onerror = reject
      document.head.appendChild(script)
    })
  }

  // List files from Google Drive
  async listFiles(mimeTypes: string[] = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']): Promise<GoogleDriveFile[]> {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }

    try {
      const mimeTypeQuery = mimeTypes.map(type => `mimeType='${type}'`).join(' or ')
      const query = `(${mimeTypeQuery}) and trashed=false`

      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,mimeType,size,modifiedTime,webViewLink)&key=${this.apiKey}`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`)
      }

      const data = await response.json()
      return data.files || []
    } catch (error) {
      console.error('Failed to list Google Drive files:', error)
      throw error
    }
  }

  // Download file content from Google Drive
  async downloadFile(fileId: string): Promise<Blob> {
    if (!this.accessToken) {
      throw new Error('Not authenticated')
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to download file: ${response.statusText}`)
      }

      return await response.blob()
    } catch (error) {
      console.error('Failed to download Google Drive file:', error)
      throw error
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken
  }

  // Sign out
  async signOut(): Promise<void> {
    try {
      const authInstance = gapi.auth2.getAuthInstance()
      await authInstance.signOut()
      this.accessToken = null
    } catch (error) {
      console.error('Failed to sign out:', error)
    }
  }

  // Format file size
  formatFileSize(bytes: string): string {
    const size = parseInt(bytes)
    if (size === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(size) / Math.log(k))
    return parseFloat((size / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }
}

// Global instance
export const googleDriveService = new GoogleDriveService() 