const express = require("express");
const router = express.Router();

const multer = require("multer");
const fs = require("fs");
const path = require("path");

// ✅ PDF parser
const PDFParser = require("pdf2json");

// 📁 Ensure uploads folder exists
const uploadPath = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath);
}

// 📌 Multer setup
const upload = multer({ dest: uploadPath });

let storedText = "";

// ==========================
// 📌 UPLOAD PDF
// ==========================
router.post("/upload", upload.single("file"), async (req, res) => {
  let filePath = "";

  try {
    console.log("Incoming file:", req.file);

    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded ❌" });
    }

    if (req.file.mimetype !== "application/pdf") {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Only PDF files allowed ❗" });
    }

    filePath = req.file.path;

    const pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataError", (err) => {
      console.error("PDF READ ERROR:", err);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

      return res.status(500).json({
        error: "PDF read failed ❌",
      });
    });

    pdfParser.on("pdfParser_dataReady", (pdfData) => {
      try {
        let text = "";

        if (!pdfData?.Pages) {
          throw new Error("Invalid PDF");
        }

        pdfData.Pages.forEach((page) => {
          page.Texts?.forEach((t) => {
            t.R?.forEach((r) => {
              try {
                text += decodeURIComponent(r.T) + " ";
              } catch {
                text += r.T + " ";
              }
            });
          });
        });

        storedText = text;

        console.log("Extracted text length:", storedText.length);

        if (!storedText || storedText.trim().length < 20) {
          fs.unlinkSync(filePath);
          return res.status(400).json({
            error: "PDF has no readable text ❗",
          });
        }

        fs.unlinkSync(filePath);

        res.json({ message: "PDF uploaded and processed ✅" });

      } catch (e) {
        console.error("PROCESS ERROR:", e);

        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

        res.status(500).json({
          error: "PDF parsing failed ❌",
        });
      }
    });

    pdfParser.loadPDF(filePath);

  } catch (error) {
    console.error("UPLOAD FULL ERROR:", error);

    if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);

    res.status(500).json({ error: "Upload error ❌" });
  }
});


// ==========================
// 📌 CHAT (SMART FREE VERSION)
// ==========================
router.post("/", async (req, res) => {
  try {
    const { message } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required ❗" });
    }

    if (!storedText) {
      return res.status(400).json({ error: "Upload a PDF first ❗" });
    }

    const lowerMsg = message.toLowerCase();

    // ==========================
    // 📌 SUMMARY MODE
    // ==========================
    if (
      lowerMsg.includes("summary") ||
      lowerMsg.includes("summarize") ||
      lowerMsg.includes("about")
    ) {
      const words = storedText.split(" ").slice(0, 120);
      return res.json({
        reply: "📄 Summary:\n\n" + words.join(" ") + "...",
      });
    }

    // ==========================
    // 📌 SMART SEARCH
    // ==========================

    // remove small useless words
    const keywords = message
      .toLowerCase()
      .split(" ")
      .filter((w) => w.length > 3);

    const sentences = storedText.split(/[.?!]/);

    const scored = sentences.map((line) => {
      let score = 0;

      keywords.forEach((word) => {
        if (line.toLowerCase().includes(word)) {
          score++;
        }
      });

      return { line, score };
    });

    const bestMatches = scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    if (bestMatches.length > 0) {
      return res.json({
        reply:
          bestMatches
            .map((m) => m.line.trim())
            .filter(Boolean)
            .join(". ") + ".",
      });
    }

    return res.json({
      reply: "No relevant answer found ❗ Try simpler keywords.",
    });

  } catch (error) {
    console.error("Chat Error:", error);
    res.status(500).json({ error: "Error in chat ❌" });
  }
});

module.exports = router;