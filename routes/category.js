const express = require('express')
const router = express.Router();
const Category = require("../model/category");
const SubCategory = require("../model/subCategory");
const Product = require("../model/product");
const asyncHandler = require("express-async-handler");
const dotenv = require("dotenv");
dotenv.config();
const cloudinary = require('cloudinary').v2;
const multer = require('multer');


// const { uploadCategory } = require("../uploadFile");
// const multer = require("multer");
// const uploadOnCloudinary = require("../utils/cloudinary");


// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup for file upload
const storage = multer.memoryStorage(); // Store file in memory buffer
const upload = multer({ storage });


// Get all categories
router.get(
  "/",
  asyncHandler(async (req, res) => {
    try {
      const categories = await Category.find();
      res.json({
        success: true,
        message: "Categories retrieved successfully.",
        data: categories,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Get a category by ID
router.get(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const categoryID = req.params.id;
      const category = await Category.findById(categoryID);
      if (!category) {
        return res
          .status(404)
          .json({ success: false, message: "Category not found." });
      }
      res.json({
        success: true,
        message: "Category retrieved successfully.",
        data: category,
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

// Create a new category with image upload
router.post("/",upload.single("img"), asyncHandler(async (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
          return res
            .status(400)
            .json({ success: false, message: "Name is required." });
        }

        let imageUrl = "no_url"; // Default URL if no file is uploaded

        if (req.file) {
          const result = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: "image" }, (error, result) => {
              if (error) {
                return reject(error);
              }
              resolve(result);
            }).end(req.file.buffer);
          });
    
          imageUrl = result.secure_url; // Store the Cloudinary image URL
          console.log("Images Stored to cloudinary img url: ", imageUrl);
        }

        console.log("Image URL to be saved:", imageUrl);

        console.log("Cloudinary Config:", {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        try {
          // Create a new category
          const newCategory = new Category({
            name: name,
            image: imageUrl,
          });
          await newCategory.save();
          res.json({
            success: true,
            message: "Category created successfully.",
            data: null,
          });
        } catch (error) {
          console.error("Error creating category:", error);
          res.status(500).json({ success: false, message: error.message });
        }
    } catch (err) {
      console.error(`Error creating category: ${err.message}`);
      return res.status(500).json({ success: false, message: err.message });
    }
  })
);

// Update a category
router.put('/:id',upload.single("img"), asyncHandler(async (req, res) => {
    try {
           
            const { name } = req.body;

            if (!name) {
                return res.status(400).json({ success: false, message: "Name is required." });
            }

            let imageUrl = req.body.image || 'no_url'; // Default URL if no file is uploaded
            if (req.file) {
              const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream({ resource_type: "image" }, (error, result) => {
                  if (error) {
                    return reject(error);
                  }
                  resolve(result);
                }).end(req.file.buffer);
              });
        
              imageUrl = result.secure_url; // Store the Cloudinary image URL
              console.log("Images Stored to cloudinary img url: ", imageUrl);
            }

            console.log("Image URL to be updated:", imageUrl);

            try {
                const categoryID = req.params.id;
                const updatedCategory = await Category.findByIdAndUpdate(
                    categoryID,
                    { name: name, image: imageUrl },
                    { new: true }
                );

                if (!updatedCategory) {
                    return res.status(404).json({ success: false, message: "Category not found." });
                }

                res.json({
                    success: true,
                    message: "Category updated successfully.",
                    data: null
                });
            } catch (error) {
                console.error("Error updating category:", error);
                res.status(500).json({ success: false, message: error.message });
            }
        
    } catch (err) {
        console.error(`Error updating category: ${err.message}`);
        return res.status(500).json({ success: false, message: err.message });
    }
}));

// Delete a category
router.delete(
  "/:id",
  asyncHandler(async (req, res) => {
    try {
      const categoryID = req.params.id;

      // Check if any subcategories reference this category
      const subcategories = await SubCategory.find({ categoryId: categoryID });
      if (subcategories.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete category. Subcategories are referencing it.",
        });
      }

      // Check if any products reference this category
      const products = await Product.find({ proCategoryId: categoryID });
      if (products.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Cannot delete category. Products are referencing it.",
        });
      }

      // If no subcategories or products are referencing the category, proceed with deletion
      const category = await Category.findByIdAndDelete(categoryID);
      if (!category) {
        return res
          .status(404)
          .json({ success: false, message: "Category not found." });
      }
      res.json({ success: true, message: "Category deleted successfully." });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

module.exports = router;
