const express = require('express');
const router = express.Router();
const Product = require('../model/product');
const { uploadProduct } = require('../uploadFile');
const asyncHandler = require('express-async-handler');
const cloudinary = require('cloudinary').v2;
const multer = require('multer')
const dotenv = require("dotenv");
dotenv.config();


// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Multer setup for file upload
const storage = multer.memoryStorage(); // Store file in memory buffer
const upload = multer({ storage });



// Get all products
router.get('/', asyncHandler(async (req, res) => {
    try {
        const products = await Product.find()
        .populate('proCategoryId', 'id name')
        .populate('proSubCategoryId', 'id name')
        .populate('proBrandId', 'id name')
        .populate('proVariantTypeId', 'id type')
        .populate('proVariantId', 'id name');
        res.json({ success: true, message: "Products retrieved successfully.", data: products });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Get a product by ID
router.get('/:id', asyncHandler(async (req, res) => {
    try {
        const productID = req.params.id;
        const product = await Product.findById(productID)
            .populate('proCategoryId', 'id name')
            .populate('proSubCategoryId', 'id name')
            .populate('proBrandId', 'id name')
            .populate('proVariantTypeId', 'id name')
            .populate('proVariantId', 'id name');
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }
        res.json({ success: true, message: "Product retrieved successfully.", data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

// Add a new product
router.post(
  "/",
  asyncHandler(async (req, res) => {
    try {
      upload.fields([
        { name: "image1", maxCount: 1 },
        { name: "image2", maxCount: 1 },
        { name: "image3", maxCount: 1 },
        { name: "image4", maxCount: 1 },
        { name: "image5", maxCount: 1 },
      ])(req, res, async function (err) {
        if (err instanceof multer.MulterError || err) {
          console.error(`Add product: ${err}`);
          return res.status(400).json({ success: false, message: err.message });
        }

        console.log("Cloudinary Config:", {
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
        });

        const {
          name,
          description,
          quantity,
          minQuantity,
          price,
          offerPrice,
          wholesalePrice,
          wholesaleOfferPrice,
          proCategoryId,
          proSubCategoryId,
          proBrandId,
          proVariantTypeId,
          proVariantId,
        } = req.body;

        if (!name || !quantity || !price || !proCategoryId || !proSubCategoryId) {
          return res
            .status(400)
            .json({ success: false, message: "Required fields are missing." });
        }

        const imageUrls = [];
        const fields = ["image1", "image2", "image3", "image4", "image5"];

        for (const field of fields) {
          if (req.files[field] && req.files[field].length > 0) {
            try {
              const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                  { resource_type: "image" },
                  (error, result) => {
                    if (error) {
                      return reject(error);
                    }
                    resolve(result);
                  }
                ).end(req.files[field][0].buffer);
              });
              imageUrls.push({ image: field, url: result.secure_url });
            } catch (uploadError) {
              console.error(
                `Error uploading image ${field} to Cloudinary: ${uploadError.message}`
              );
              return res.status(500).json({
                success: false,
                message: `Failed to upload image: ${field}`,
              });
            }
          }
        }

        const newProduct = new Product({
          name,
          description,
          quantity,
          minQuantity,
          price,
          offerPrice,
          wholesalePrice,
          wholesaleOfferPrice,
          proCategoryId,
          proSubCategoryId,
          proBrandId,
          proVariantTypeId,
          proVariantId,
          images: imageUrls,
        });

        await newProduct.save();
        res.json({
          success: true,
          message: "Product created successfully.",
          data: newProduct,
        });
      });
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ success: false, message: error.message });
    }
  })
);

  
  // Update a product
  router.put(
    "/:id",
    asyncHandler(async (req, res) => {
      const productId = req.params.id;
      try {
        uploadProduct.fields([
          { name: "image1", maxCount: 1 },
          { name: "image2", maxCount: 1 },
          { name: "image3", maxCount: 1 },
          { name: "image4", maxCount: 1 },
          { name: "image5", maxCount: 1 },
        ])(req, res, async function (err) {
          if (err) {
            console.error(`Update product: ${err}`);
            return res.status(400).json({ success: false, message: err.message });
          }
  
          const {
            name,
            description,
            quantity,
            minQuantity,
            price,
            offerPrice,
            wholesalePrice,
            wholesaleOfferPrice,
            proCategoryId,
            proSubCategoryId,
            proBrandId,
            proVariantTypeId,
            proVariantId,
          } = req.body;
  
          const productToUpdate = await Product.findById(productId);
          if (!productToUpdate) {
            return res
              .status(404)
              .json({ success: false, message: "Product not found." });
          }
  
          productToUpdate.name = name || productToUpdate.name;
          productToUpdate.description = description || productToUpdate.description;
          productToUpdate.quantity = quantity || productToUpdate.quantity;
          productToUpdate.minQuantity = minQuantity || productToUpdate.minQuantity;
          productToUpdate.price = price || productToUpdate.price;
          productToUpdate.offerPrice = offerPrice || productToUpdate.offerPrice;
          productToUpdate.wholesalePrice = wholesalePrice || productToUpdate.wholesalePrice;
          productToUpdate.wholesaleOfferPrice = wholesaleOfferPrice || productToUpdate.wholesaleOfferPrice;
          productToUpdate.proCategoryId = proCategoryId || productToUpdate.proCategoryId;
          productToUpdate.proSubCategoryId = proSubCategoryId || productToUpdate.proSubCategoryId;
          productToUpdate.proBrandId = proBrandId || productToUpdate.proBrandId;
          productToUpdate.proVariantTypeId = proVariantTypeId || productToUpdate.proVariantTypeId;
          productToUpdate.proVariantId = proVariantId || productToUpdate.proVariantId;
  
          const fields = ["image1", "image2", "image3", "image4", "image5"];
  
          for (const field of fields) {
            if (req.files[field] && req.files[field].length > 0) {
              try {
                const result = await new Promise((resolve, reject) => {
                  cloudinary.uploader.upload_stream(
                    { resource_type: "image" },
                    (error, result) => {
                      if (error) {
                        return reject(error);
                      }
                      resolve(result);
                    }
                  ).end(req.files[field][0].buffer);
                });
                imageUrls.push({ image: field, url: result.secure_url });
              } catch (uploadError) {
                console.error(
                  `Error uploading image ${field} to Cloudinary: ${uploadError.message}`
                );
                return res.status(500).json({
                  success: false,
                  message: `Failed to upload image: ${field}`,
                });
              }
            }
          }
  
          await productToUpdate.save();
          res.json({
            success: true,
            message: "Product updated successfully.",
          });
        });
      } catch (error) {
        console.error("Error updating product:", error);
        res.status(500).json({ success: false, message: error.message });
      }
    })
  );


// Delete a product
router.delete('/:id', asyncHandler(async (req, res) => {
    const productID = req.params.id;
    try {
        const product = await Product.findByIdAndDelete(productID);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }
        res.json({ success: true, message: "Product deleted successfully." });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}));

module.exports = router;
