import { NextRequest, NextResponse } from "next/server"
import { retrieveCart } from "@lib/data/cart"
import { setCartId } from "@lib/data/cookies"

type Params = Promise<{
  countryCode: string
  id: string
}>

export async function GET(
  req: NextRequest,
  { params }: { params: Params }
) {
  const { countryCode, id } = await params

  try {
    const cart = await retrieveCart(id)

    if (!cart) {
      return NextResponse.redirect(
        new URL(`/${countryCode}/cart?error=cart_not_found`, req.url)
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
          new URL(`/${countryCode}/cart?error=quote_expired`, req.url)
        )
      }
    }

    await setCartId(id)

    return NextResponse.redirect(
      new URL(`/${countryCode}/cart`, req.url)
    )
  } catch (error) {
    console.error("Error recuperando carrito:", error)

    return NextResponse.redirect(
      new URL(`/${countryCode}/cart?error=recovery_error`, req.url)
    )
  }
}