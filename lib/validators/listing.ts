import { z } from "zod"

export const ListingSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  address: z.string().min(5),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  photos: z.array(z.string().url()).optional(),
})

export type ListingInput = z.infer<typeof ListingSchema>
