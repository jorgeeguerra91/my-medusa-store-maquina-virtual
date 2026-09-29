"use client"

import { useEffect } from "react"
import { useParams, useSearchParams } from "next/navigation"
import { decodeToken } from "react-jwt"

import { sdk } from "@lib/config"
import { setGoogleAuthToken } from "@lib/data/customer"

export default function GoogleCallback() {
  const searchParams = useSearchParams()
  const params = useParams()
  const countryCode = params.countryCode as string

  useEffect(() => {
    const validateCallback = async () => {
      try {
        const token = await sdk.auth.callback(
          "customer",
          "google",
          Object.fromEntries(searchParams.entries())
        )

        const decodedToken = decodeToken(token as string) as {
          actor_id: string
          user_metadata: Record<string, unknown>
        }

        if (decodedToken.actor_id === "") {
          await sdk.store.customer.create({
            email: decodedToken.user_metadata.email as string,
          })

          const refreshedToken = await sdk.auth.refresh()

          await setGoogleAuthToken(refreshedToken as string)
        } else {
          await setGoogleAuthToken(token as string)
        }

        window.location.href = `/${countryCode}/account`
      } catch (error) {
        console.error("Google callback error:", error)
      }
    }

    validateCallback()
  }, [searchParams, countryCode])

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <p>Iniciando sesion con Google...</p>
    </div>
  )
}