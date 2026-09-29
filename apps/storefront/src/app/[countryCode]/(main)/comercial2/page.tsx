import { redirect } from "next/navigation"

import Comercial2Form from "../comercial2/comercial2-form"

import { retrieveCustomer } from "@lib/data/customer"

export default async function Comercial2Page() {
  const customer = await retrieveCustomer()

  if (!customer) {
    redirect("/co/account")
  }

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

      <Comercial2Form />
    </div>
  )
}