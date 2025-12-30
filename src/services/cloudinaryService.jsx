import axios from "axios";

const CLOUD_NAME = "dellh4wkq";
const UPLOAD_PRESET = "portfolime_uploads";

export const uploadFileToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  // Determine resource type
  // UPDATE: We explicitly force 'image' for PDFs.
  // This ensures Cloudinary allows inline viewing and thumbnail generation.
  let resourceType = "auto";

  // Images + PDFs
  if (
    file.type.startsWith("image/") ||
    file.type === "application/pdf" ||
    file.name.toLowerCase().endsWith(".pdf")
  ) {
    resourceType = "image";
  }
  // Videos
  else if (file.type.startsWith("video/")) {
    resourceType = "video";
  }

  try {
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/${resourceType}/upload`,
      formData
    );

    // FIX: Explicitly detect PDF to save correct type in Database
    let finalType = response.data.resource_type;
    const format = response.data.format || "";

    // If Cloudinary says it's a PDF, or the file extension is PDF, mark it as 'pdf' type
    if (format === "pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      finalType = "pdf";
    }

    return {
      url: response.data.secure_url,
      type:
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
          ? "pdf"
          : response.data.resource_type,
      name: file.name,
      originalFormat: response.data.format || "",
    };
  } catch (error) {
    console.error("Cloudinary Upload Error:", error);
    throw new Error("Failed to upload file");
  }
};
