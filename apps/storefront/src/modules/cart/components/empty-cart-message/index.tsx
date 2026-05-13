import { Heading, Text } from "@modules/common/components/ui"

import InteractiveLink from "@modules/common/components/interactive-link"

const EmptyCartMessage = () => {
  return (
    <div className="py-48 px-2 flex flex-col justify-center items-start" data-testid="empty-cart-message">
      <Heading
        level="h1"
        className="flex flex-row text-coemColors-azulCoem gap-x-2 items-baseline"
      >
        Carrito
      </Heading>
      <Text className="text-coemColors-azulCoem mt-4 mb-6 max-w-[32rem]">
        No tienes nada en tu carrito. Cambiemos eso!!, Usa el link debajo
        para encontrar tus productos.
      </Text>
      <div>
        <InteractiveLink href="/store">Explorar productos</InteractiveLink>
      </div>
    </div>
  )
}

export default EmptyCartMessage
