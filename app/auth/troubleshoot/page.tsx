"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

export default function TroubleshootPage() {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [configInfo, setConfigInfo] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchDebugInfo = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/auth/debug")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setDebugInfo(data)
    } catch (e) {
      setError(`Failed to fetch debug info: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  const fetchConfigInfo = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch("/api/auth/check-config")
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      setConfigInfo(data)
    } catch (e) {
      setError(`Failed to fetch config info: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDebugInfo()
    fetchConfigInfo()
  }, [])

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Google OAuth Troubleshooting</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="diagnosis">
        <TabsList className="mb-4">
          <TabsTrigger value="diagnosis">Diagnosis</TabsTrigger>
          <TabsTrigger value="configuration">Configuration Guide</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
        </TabsList>

        <TabsContent value="diagnosis">
          <Card>
            <CardHeader>
              <CardTitle>OAuth Configuration Diagnosis</CardTitle>
              <CardDescription>This tool helps diagnose issues with your Google OAuth configuration.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-medium mb-2">Environment Variables</h3>
                  {debugInfo && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>GOOGLE_CLIENT_ID:</span>
                        <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {debugInfo.auth.googleClientId}
                        </span>
                        {debugInfo.auth.googleClientIdLength > 0 ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span>GOOGLE_CLIENT_SECRET:</span>
                        <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {debugInfo.auth.googleClientSecretSet}
                        </span>
                        {debugInfo.auth.googleClientSecretSet === "Set (hidden for security)" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span>NEXTAUTH_URL:</span>
                        <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {debugInfo.auth.nextAuthUrl}
                        </span>
                        {debugInfo.auth.nextAuthUrl !== "Not set" ? (
                          <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-yellow-500" />
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <span>Base URL:</span>
                        <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {debugInfo.auth.baseUrl}
                        </span>
                      </div>
                    </div>
                  )}

                  <h3 className="text-lg font-medium mt-6 mb-2">OAuth Configuration</h3>
                  {configInfo && (
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium">Redirect URI:</h4>
                        <div className="font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1 break-all">
                          {configInfo.googleOAuth.redirectUri}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium">Authorized JavaScript Origins:</h4>
                        <div className="font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                          <ul className="list-disc list-inside">
                            {configInfo.googleOAuth.authorizedJavaScriptOrigins.map((origin: string, i: number) => (
                              <li key={i} className="break-all">
                                {origin}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium">Authorized Redirect URIs:</h4>
                        <div className="font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded mt-1">
                          <ul className="list-disc list-inside">
                            {configInfo.googleOAuth.authorizedRedirectUris.map((uri: string, i: number) => (
                              <li key={i} className="break-all">
                                {uri}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
            <CardFooter>
              <Button
                onClick={() => {
                  fetchDebugInfo()
                  fetchConfigInfo()
                }}
              >
                Refresh Information
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="configuration">
          <Card>
            <CardHeader>
              <CardTitle>Google OAuth Configuration Guide</CardTitle>
              <CardDescription>
                Follow these steps to properly configure Google OAuth for your application.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Step 1: Create OAuth Credentials</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>
                      Go to the{" "}
                      <a
                        href="https://console.cloud.google.com/apis/credentials"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Google Cloud Console
                      </a>
                    </li>
                    <li>Select your project or create a new one</li>
                    <li>Click "Create Credentials" and select "OAuth client ID"</li>
                    <li>Select "Web application" as the application type</li>
                    <li>Give your OAuth client a name (e.g., "My Next.js App")</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Step 2: Configure Authorized JavaScript Origins</h3>
                  <p className="mb-2">Add these origins to your OAuth client:</p>
                  {configInfo && (
                    <div className="font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      <ul className="list-disc list-inside">
                        {configInfo?.googleOAuth.authorizedJavaScriptOrigins.map((origin: string, i: number) => (
                          <li key={i} className="break-all">
                            {origin}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Step 3: Configure Authorized Redirect URIs</h3>
                  <p className="mb-2">Add these redirect URIs to your OAuth client:</p>
                  {configInfo && (
                    <div className="font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      <ul className="list-disc list-inside">
                        {configInfo?.googleOAuth.authorizedRedirectUris.map((uri: string, i: number) => (
                          <li key={i} className="break-all">
                            {uri}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Step 4: Configure OAuth Consent Screen</h3>
                  <ol className="list-decimal list-inside space-y-2">
                    <li>
                      Go to the{" "}
                      <a
                        href="https://console.cloud.google.com/apis/credentials/consent"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        OAuth consent screen
                      </a>
                    </li>
                    <li>Select "External" or "Internal" user type (External for public apps)</li>
                    <li>Fill in the required fields (App name, User support email, Developer contact information)</li>
                    <li>Add the scopes you need (typically "email" and "profile")</li>
                    <li>Add test users if your app is in testing mode</li>
                    <li>Submit and publish your app</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Step 5: Set Environment Variables</h3>
                  <p className="mb-2">Add these environment variables to your application:</p>
                  <div className="font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
                    <pre>{`GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=your_app_url
NEXTAUTH_SECRET=your_nextauth_secret`}</pre>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist">
          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting Checklist</CardTitle>
              <CardDescription>
                Use this checklist to resolve the "Access blocked: This app's request is invalid" error.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-2">
                  <input type="checkbox" id="check1" className="mt-1" />
                  <label htmlFor="check1">
                    <strong>Verify Client ID and Secret:</strong> Ensure your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
                    environment variables are correctly set and match the values in Google Cloud Console.
                  </label>
                </div>

                <div className="flex items-start gap-2">
                  <input type="checkbox" id="check2" className="mt-1" />
                  <label htmlFor="check2">
                    <strong>Check Authorized Redirect URIs:</strong> Verify that the callback URL (
                    <code>/api/auth/callback/google</code>) is added to the Authorized Redirect URIs in Google Cloud
                    Console.
                  </label>
                </div>

                <div className="flex items-start gap-2">
                  <input type="checkbox" id="check3" className="mt-1" />
                  <label htmlFor="check3">
                    <strong>Check Authorized JavaScript Origins:</strong> Ensure your application's domain is added to
                    the Authorized JavaScript Origins in Google Cloud Console.
                  </label>
                </div>

                <div className="flex items-start gap-2">
                  <input type="checkbox" id="check4" className="mt-1" />
                  <label htmlFor="check4">
                    <strong>Verify OAuth Consent Screen:</strong> Make sure your OAuth consent screen is properly
                    configured and published.
                  </label>
                </div>

                <div className="flex items-start gap-2">
                  <input type="checkbox" id="check5" className="mt-1" />
                  <label htmlFor="check5">
                    <strong>Check API Enabled:</strong> Ensure the Google People API is enabled for your project in
                    Google Cloud Console.
                  </label>
                </div>

                <div className="flex items-start gap-2">
                  <input type="checkbox" id="check6" className="mt-1" />
                  <label htmlFor="check6">
                    <strong>Verify NEXTAUTH_URL:</strong> Ensure NEXTAUTH_URL is set to your application's URL and
                    matches the domain in Authorized JavaScript Origins.
                  </label>
                </div>

                <div className="flex items-start gap-2">
                  <input type="checkbox" id="check7" className="mt-1" />
                  <label htmlFor="check7">
                    <strong>Check for Domain Mismatch:</strong> Ensure you're accessing the application from the same
                    domain that's configured in Google Cloud Console.
                  </label>
                </div>

                <div className="flex items-start gap-2">
                  <input type="checkbox" id="check8" className="mt-1" />
                  <label htmlFor="check8">
                    <strong>Verify Project Status:</strong> Make sure your Google Cloud project is not suspended or
                    disabled.
                  </label>
                </div>

                <div className="flex items-start gap-2">
                  <input type="checkbox" id="check9" className="mt-1" />
                  <label htmlFor="check9">
                    <strong>Check for API Restrictions:</strong> If you've set up API key restrictions, ensure they're
                    not blocking your authentication requests.
                  </label>
                </div>

                <div className="flex items-start gap-2">
                  <input type="checkbox" id="check10" className="mt-1" />
                  <label htmlFor="check10">
                    <strong>Verify Test Users:</strong> If your app is in testing mode, ensure the user you're trying to
                    authenticate with is added as a test user.
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
