export const POPULATE_ROLE = {
  path: "userRole",
  populate: { path: "permissions" },
};

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif"];
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png"];