import express from "express";
import cors from "cors";
import { Test } from "./controllers/test.js";
import multer from "multer";

// create router
const router = express.Router();
const oneHour = 3600000;

// create multer config
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
});

// Configure CORS on api
const corsOptions = {
  allowedHeaders: ["Content-Type", "Authorization"],
  methods: ["POST", "GET"],
  maxAge: oneHour,
};

router.route("/test").post(cors(corsOptions), upload.single("video"), Test);
// All routes starts with prefix /api

export default router;
