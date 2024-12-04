const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Define Cloudinary storage for multer
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: async (req, file) => {
        const folder = req.folder || "epharmacylocator"; // Use req.folder directly
        const publicId = `${file.originalname.split(" ").join("-")}-${Date.now()}`;
        return {
            folder: folder, // Folder name set dynamically
            allowed_formats: ["jpg", "png", "jpeg"],
            public_id: publicId,
        };
    },
});


const uploadOptions = multer({ storage: storage });

module.exports = { cloudinary, uploadOptions };
