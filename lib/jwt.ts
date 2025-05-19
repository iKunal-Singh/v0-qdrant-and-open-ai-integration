import { SignJWT, jwtVerify } from "jose"

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "your-secret-key"

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not defined")
}

export async function createToken(payload: any, expiresIn = "1d") {
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(new TextEncoder().encode(JWT_SECRET))

  return token
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(JWT_SECRET))
    return payload
  } catch (error) {
    return null
  }
}
