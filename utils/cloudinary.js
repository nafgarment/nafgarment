const cloudinary = require('cloudinary').v2;

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async function (filepath) {
    try {
        if (!filepath) {
            console.error("Filepath is undefined or null.");
            return null;
        }
            console.log("file paths",filepath)
        const response = await cloudinary.uploader.upload(filepath);
        console.log("File uploaded successfully!", response.url);
        return response.url;
    } catch (error) {
        console.error("Error uploading to Cloudinary:", error);
        return 
        null;
    }
};

module.exports = uploadOnCloudinary;
