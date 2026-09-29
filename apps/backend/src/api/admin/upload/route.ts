import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import multer from "multer"

const upload = multer({
  storage: multer.memoryStorage(),
})

export const POST = async (
  req: MedusaRequest,
  res: MedusaResponse
) => {

upload.single("file")(req as any, res as any, async (err: any) => {

    if (err) {
      return res.status(400).json({
        error: err.message
      })
    }

    const file = (req as any).file

    console.log(file)

    return res.json({
      filename: file.originalname,
      size: file.size,
      mimetype: file.mimetype
    })
  })
}