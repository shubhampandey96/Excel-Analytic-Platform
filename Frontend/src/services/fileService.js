// excel-analytics-frontend/src/services/fileService.js
import api from "./api";

// Change the function signature to accept 'file' instead of 'formData'
const uploadFile = async (file) => {
  try {
    // Create a new FormData object
    const formData = new FormData();
    // Append the file to the FormData object under the key 'file'
    // This 'file' key must match the name expected by your multer middleware on the backend (upload.single('file'))
    formData.append("file", file);

    // Now, pass the formData object to api.post
    // Removed the duplicated '/api' prefix
    const response = await api.post("/files/upload", formData);
    return response.data;
  } catch (error) {
    // Ensure error handling is consistent
    throw error.response?.data?.message || error.message; // Use 'message' for backend errors
  }
};

const fileService = {
  uploadFile,
};

export default fileService;
