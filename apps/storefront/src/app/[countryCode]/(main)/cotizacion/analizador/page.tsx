import { redirect } from "next/navigation"

import AnalizadorForm from "./analizador-form"
import { retrieveCustomer } from "@lib/data/customer"

export default async function AnalizadorPage() {
  const customer = await retrieveCustomer()

  if (!customer) {
    redirect("/co/account")
  }

  return (
    <div className="content-container py-10">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">
          Analizador de cotización
        </h1>

        <p className="text-gray-500 mb-8">
          Carga un PDF para identificar sus productos
          y generar un carrito.
        </p>

        <AnalizadorForm
          customerEmail={customer.email}
        />
      </div>
    </div>
  )
}