import { redirect } from "next/navigation"

import ComercialForm from "./comercial-form"
import { retrieveCustomer } from "@lib/data/customer"

export default async function ComercialPage() {
  const customer = await retrieveCustomer()

  // No ha iniciado sesión
  if (!customer) {
    redirect("/co/account")
  }

  // No es el usuario autorizado
  if (customer.email !== "jguerrag@coem2.co") {
    return (
      <div className="max-w-2xl mx-auto py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">
          Acceso denegado
        </h1>

        <p className="text-gray-600">
          No tiene permisos para acceder a esta página.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-12 px-6">
      <h1 className="text-3xl font-bold mb-8">
        Cotización
      </h1>

      <ComercialForm />
    </div>
  )
}