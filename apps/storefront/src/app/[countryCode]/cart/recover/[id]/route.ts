
import { NextRequest, NextResponse } from "next/server"
import { retrieveCart } from "@lib/data/cart"
import { setCartId } from "@lib/data/cookies"

type Params = Promise<{
  countryCode: string
  id: string
}>

function getRequestOrigin(req: NextRequest): string {
  const forwardedHost = req.headers
    .get("x-forwarded-host")
    ?.split(",")[0]
    .trim()

  const host = req.headers.get("host")?.trim()

  const hosts = [forwardedHost, host].filter(
    (value): value is string => Boolean(value)
  )

  const cloudflareHost = hosts.find((value) =>
    /^[a-z0-9-]+\.trycloudflare\.com$/i.test(value)
  )

  if (cloudflareHost) {
    return `https://${cloudflareHost}`
  }

  const localHost = hosts.find((value) =>
    /^(localhost|127\.0\.0\.1):8000$/i.test(value)
  )

  if (localHost) {
    return `http://${localHost}`
  }

  return req.nextUrl.origin
}

export async function GET(
  req: NextRequest,
  { params }: { params: Params }
) {
  const { countryCode, id } = await params
  const origin = getRequestOrigin(req)

  try {
    const cart = await retrieveCart(id)

    if (!cart) {
      return NextResponse.redirect(
        new URL(`/${countryCode}/cart?error=cart_not_found`, origin)
      )
    }

    const expiresAt = cart.metadata?.quote_expires_at

    if (expiresAt) {
      const expirationDate = new Date(String(expiresAt))

      if (
        Number.isNaN(expirationDate.getTime()) ||
        new Date() > expirationDate
      ) {
        return NextResponse.redirect(
          new URL(`/${countryCode}/cart?error=quote_expired`, origin)
        )
      }
    }

    await setCartId(id)

    return NextResponse.redirect(
      new URL(`/${countryCode}/cart`, origin)
    )
  } catch (error) {
    console.error("Error recuperando carrito:", error)

    return NextResponse.redirect(
      new URL(`/${countryCode}/cart?error=recovery_error`, origin)
    )
  }
}
