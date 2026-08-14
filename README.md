# 🍌 BananaReady

> AI-powered banana ripeness analysis using computer vision.

BananaReady is a computer-vision web application that analyzes banana images and provides an estimated ripeness and visual-condition report.

The project is designed to explore how AI and image processing can be combined to answer a simple question:

**"Is this banana ready to eat?" 🍌**

---

## [Live Demon] [[https://banana-redy-u3pb.vercel.app/]]

## ✨ Features

- 📷 Live camera scanning
- 📤 Banana image upload
- 🤖 MobileNet image classification
- 🎯 COCO-SSD object detection
- 🖼️ Image processing using Sharp
- 🍌 Banana detection
- 🎨 Visual color analysis
- 🟤 Brown-spot analysis
- 📊 Ripeness estimation
- 🟢 Banana condition estimation
- 🎯 Confidence estimation
- 🌱 Banana-variety selection
  - Robusta
  - Red Dacca / Chenkadali
  - Other
- 📋 Banana analysis report
- 🕒 Scan history interface

---

## 🧠 How It Works

BananaReady combines browser-based machine learning with server-side image processing.

```text
                 Banana Image
                      │
              ┌───────┴────────┐
              │                │
           Camera           Upload
              │                │
              └───────┬────────┘
                      ↓
                COCO-SSD
                      ↓
              Banana Detection
                      ↓
                 MobileNet
                      ↓
              Image Classification
                      ↓
                  Sharp
                      ↓
             Visual Analysis
                      ↓
          ┌───────────┴───────────┐
          │                       │
     Color Analysis          Brown Spots
          │                       │
          └───────────┬───────────┘
                      ↓
              Ripeness Analysis
                      ↓
               Banana Report
