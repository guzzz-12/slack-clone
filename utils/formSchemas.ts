import { z } from "zod";

const MAX_FILE_SIZE = 5000000;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

export const WorkspaceFormSchema = z.object({
  name: z
    .string()
    .min(1, {message: "The name is required"})
    .min(3, {message: "The name must contain at least 3 characters"})
    .refine((val) => {
      return val.trim().length >= 3
    }, {message: "The name must be at least 3 characters long"})
    .refine((val) => {
      return /^[A-Za-zÀ-ž\s\d]+$/.test(val);
    }, {message: "The name can contain only letters and numbers"}),
  image: z
    .any()
    .refine((file: File) => !!file, "The image is required")
    .refine((file) => file.size <= MAX_FILE_SIZE, "The image must be maximum 5MB")
    .refine(
      (file) => ACCEPTED_IMAGE_TYPES.includes(file.type),
      "Only .jpg, .jpeg, .png and .webp formats are supported."
    )
});