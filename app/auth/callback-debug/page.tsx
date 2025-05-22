"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, AlertCircle, Info } from "lucide-react"

export default function CallbackDebugPage() {
  const [diagnostics, setDiagnostics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [issues, setIssues] = useState<string[]>([])

  const fetchDiagnostics = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/auth/callback-test")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setDiagnostics(data.diagnostics)

      // Analyze for potential issues
      const potentialIssues: string[] = []

      if (!data.diagnostics.hasNextAuthSecret) {
        potentialIssues.push("NEXTAUTH_SECRET is not set. This is required for JWT encryption.")
      }

      if (data.diagnostics.isProduction && !data.diagnostics.nextAuthUrl) {
        potentialIssues.push("NEXTAUTH_URL is not set in production. This may cause callback issues.")
      }

      if (data.diagnostics.isProduction && !data.diagnostics.hostMatchesNextAuthUrl) {
        potentialIssues.push("The current host does not match NEXTAUTH_URL. This may cause callback URL mismatches.")
      }

      if (
        data.diagnostics.isProduction &&
        data.diagnostics.proxy.hasForwardedProto &&
        data.diagnostics.proxy.forwardedProto !== "https"
      ) {
        potentialIssues.push(
          "Your application is running behind a proxy but not using HTTPS. This may cause cookie issues in production.",
        )
      }

      if (data.diagnostics.isProduction && !data.diagnostics.csrf.hasCsrfCookie) {
        potentialIssues.push("CSRF cookie not found. This may indicate issues with cookie settings.")
      }

      setIssues(potentialIssues)
    } catch (e) {
      setError(`Failed to fetch diagnostics: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDiagnostics()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Authentication Callback Diagnostics</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="diagnostics">
        <TabsList className="mb-4">
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
          <TabsTrigger value="issues">Potential Issues {issues.length > 0 && `(${issues.length})`}</TabsTrigger>
          <TabsTrigger value="solutions">Solutions</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnostics">
          <Card>
            <CardHeader>
              <CardTitle>Callback Configuration Diagnostics</CardTitle>
              <CardDescription>
                This tool helps diagnose issues with your authentication callback configuration.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                </div>
              ) : (
                diagnostics && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Environment</h3>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          <span className="font-medium">Environment:</span> {diagnostics.environment}
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          <span className="font-medium">Production Mode:</span>{" "}
                          {diagnostics.isProduction ? "Yes" : "No"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">URLs</h3>
                      <div className="space-y-2">
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          <span className="font-medium">Base URL:</span> {diagnostics.baseUrl}
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          <span className="font-medium">Google Callback URL:</span> {diagnostics.googleCallbackUrl}
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          <span className="font-medium">NEXTAUTH_URL:</span> {diagnostics.nextAuthUrl || "(not set)"}
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          <span className="font-medium">Current Host:</span> {diagnostics.host}
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded flex justify-between items-center">
                          <span className="font-medium">Host Matches NEXTAUTH_URL:</span>{" "}
                          {diagnostics.hostMatchesNextAuthUrl ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Security</h3>
                      <div className="space-y-2">
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded flex justify-between items-center">
                          <span className="font-medium">NEXTAUTH_SECRET Set:</span>{" "}
                          {diagnostics.hasNextAuthSecret ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded flex justify-between items-center">
                          <span className="font-medium">CSRF Cookie Present:</span>{" "}
                          {diagnostics.csrf.hasCsrfCookie ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          <span className="font-medium">Expected Session Cookie Name:</span>{" "}
                          {diagnostics.expectedSessionCookieName}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Proxy Information</h3>
                      <div className="space-y-2">
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          <span className="font-medium">X-Forwarded-Proto:</span>{" "}
                          {diagnostics.proxy.hasForwardedProto ? diagnostics.proxy.forwardedProto : "(not present)"}
                        </div>
                        <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                          <span className="font-medium">X-Forwarded-Host:</span>{" "}
                          {diagnostics.proxy.hasForwardedHost ? diagnostics.proxy.forwardedHost : "(not present)"}
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Cookies</h3>
                      <div className="bg-gray-100 dark:bg-gray-800 p-2 rounded">
                        <ul className="list-disc list-inside">
                          {diagnostics.cookies.map((cookie: any, i: number) => (
                            <li key={i}>
                              {cookie.name} {cookie.hasValue ? "(has value)" : "(no value)"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={fetchDiagnostics} disabled={loading}>
                {loading ? "Loading..." : "Refresh Diagnostics"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="issues">
          <Card>
            <CardHeader>
              <CardTitle>Potential Issues</CardTitle>
              <CardDescription>
                Based on the diagnostics, these are potential issues that might be causing callback problems.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                </div>
              ) : issues.length > 0 ? (
                <div className="space-y-4">
                  {issues.map((issue, index) => (
                    <Alert key={index} variant="warning">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Potential Issue</AlertTitle>
                      <AlertDescription>{issue}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>No Issues Detected</AlertTitle>
                  <AlertDescription>
                    No obvious configuration issues were detected. If you're still experiencing problems, check the
                    Solutions tab for additional troubleshooting steps.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solutions">
          <Card>
            <CardHeader>
              <CardTitle>Common Solutions</CardTitle>
              <CardDescription>Here are solutions to common authentication callback issues.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">1. NEXTAUTH_SECRET Issues</h3>
                  <p className="mb-2">
                    The NEXTAUTH_SECRET environment variable is required for JWT encryption and must be the same across
                    all environments.
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                    <strong>Solution:</strong> Generate a secure random string and set it as NEXTAUTH_SECRET in all
                    environments.
                    <pre className="mt-2 p-2 bg-gray-200 dark:bg-gray-700 rounded overflow-x-auto">
                      {`# Generate a secure random string
openssl rand -base64 32

# Add to your .env file
NEXTAUTH_SECRET=your_generated_secret`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">2. Callback URL Mismatch</h3>
                  <p className="mb-2">
                    The callback URL in your Google Cloud Console must exactly match the one used by NextAuth.js.
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                    <strong>Solution:</strong> Add the following URL to your Google Cloud Console's Authorized Redirect
                    URIs:
                    <pre className="mt-2 p-2 bg-gray-200 dark:bg-gray-700 rounded overflow-x-auto">
                      {diagnostics ? diagnostics.googleCallbackUrl : "[Your base URL]/api/auth/callback/google"}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">3. NEXTAUTH_URL Configuration</h3>
                  <p className="mb-2">
                    The NEXTAUTH_URL environment variable should be set to your application's base URL in production.
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                    <strong>Solution:</strong> Set NEXTAUTH_URL to your application's base URL:
                    <pre className="mt-2 p-2 bg-gray-200 dark:bg-gray-700 rounded overflow-x-auto">
                      {`# Add to your .env file
NEXTAUTH_URL=https://your-domain.com`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">4. Cookie Settings</h3>
                  <p className="mb-2">In production, cookies must be secure and properly configured for your domain.</p>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                    <strong>Solution:</strong> Ensure your application is served over HTTPS and update the cookie
                    settings in your NextAuth.js configuration:
                    <pre className="mt-2 p-2 bg-gray-200 dark:bg-gray-700 rounded overflow-x-auto">
                      {`cookies: {
  sessionToken: {
    name: \`\${isProduction ? "__Secure-" : ""}next-auth.session-token\`,
    options: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: isProduction,
    },
  },
  // ... other cookie settings
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">5. Proxy Configuration</h3>
                  <p className="mb-2">
                    If your application is behind a proxy, ensure the headers are properly forwarded.
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                    <strong>Solution:</strong> Configure your proxy to forward the necessary headers:
                    <pre className="mt-2 p-2 bg-gray-200 dark:bg-gray-700 rounded overflow-x-auto">
                      {`# Example Nginx configuration
proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">6. CSRF Protection</h3>
                  <p className="mb-2">
                    CSRF protection is required for secure authentication. Ensure CSRF tokens are properly handled.
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                    <strong>Solution:</strong> Ensure your application is not blocking or modifying cookies with CSRF
                    tokens. Check for middleware that might be interfering with cookie handling.
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">7. Google OAuth Configuration</h3>
                  <p className="mb-2">Ensure your Google OAuth configuration is correct and the APIs are enabled.</p>
                  <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                    <strong>Solution:</strong>
                    <ul className="list-disc list-inside mt-2">
                      <li>Verify that the Google People API is enabled in your Google Cloud project</li>
                      <li>
                        Ensure your OAuth consent screen is properly configured and published (or in testing with your
                        email added as a test user)
                      </li>
                      <li>
                        Verify that your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables match the
                        values in Google Cloud Console
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
