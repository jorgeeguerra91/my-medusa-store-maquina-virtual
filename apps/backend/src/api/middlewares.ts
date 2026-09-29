import { defineMiddlewares } from "@medusajs/framework/http"
import multer from "multer"

const upload = multer({
  storage: multer.memoryStorage(),
})

export default defineMiddlewares({
  routes: [
    {
      matcher: "/store/quote",
      method: ["POST"],
      middlewares: [
        // @ts-ignore
        upload.single("archivo"),
      ],
    },
    {
      matcher: "/store/quote-from-pdf",
      method: ["POST"],
      middlewares: [
        // @ts-ignore
        upload.single("file"),
      ],
    },
  ],
})