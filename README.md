# SmartTax (Nani Tax Service) 🚀

SmartTax is an intelligent platform designed to automate and simplify the process of tax deduction verification in Thailand. By leveraging advanced OCR, Large Language Models (LLM), and Machine Learning, the system can extract data from receipts and invoices, classify items into tax-deductible categories, and validate them against Thai tax regulations.

---

## 🛠 Tech Stack

### Frontend
- **Framework:** [Next.js 15](https://nextjs.org/) (React 19)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **State Management:** React Context API (AuthContext)
- **Utilities:** `docx` (Document generation), `file-saver`

### Backend
- **API Framework:** [FastAPI](https://fastapi.tiangolo.com/) (Python 3.x)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (Hosted on Supabase)
- **OCR:** [Typhoon OCR](https://opentyphoon.ai/) (Specialized for Thai language)
- **LLM:** [Typhoon-v2.5-30b-instruct](https://opentyphoon.ai/) (OpenAI-compatible API)
- **Machine Learning:** Scikit-learn, Joblib, PyThaiNLP (Thai2Fit Word Vectors)
- **Image Processing:** OpenCV, Pillow, PDF2Image

---

## 🔄 Project Process & Workflow

The system follows a sophisticated pipeline to ensure high accuracy in data extraction and classification:

### 1. File Ingestion
Users upload documents in **PDF, JPEG, or PNG** formats via the Next.js frontend. The backend validates file size and type before processing.

### 2. OCR & Text Extraction
- **Preprocessing:** PDFs are converted to images; images are enhanced using OpenCV to improve OCR quality.
- **Extraction:** The system uses **Typhoon OCR** to extract raw text and markdown from the documents, specifically optimized for Thai scripts and complex layouts.

### 3. LLM-Powered Data Structuring
The raw OCR text is sent to the **Typhoon-v2.5 LLM**. Using a specialized prompt, it parses the text into a structured JSON format containing:
- Seller/Buyer Information
- Tax ID (13 digits)
- Document Date (converted to Thai Buddhist Era if necessary)
- Itemized list (name, quantity, price)
- Total amount & VAT

### 4. Intelligent Classification
The system employs a **Multi-stage Machine Learning** approach:
- **Main Model:** A Voting Ensemble classifier categorizes the document into high-level tax groups (e.g., Personal/Family, Savings/Insurance, Government Policies).
- **Sub-Models:** Specialized classifiers (Personal, Invest, Assets, Easy Receipt, Donation) further drill down into specific sub-categories.
- **NLP:** Uses `thai2fit` word vectors and `PyThaiNLP` for semantic understanding of Thai text.

### 5. Verification & Condition Checking
- **Company Lookup:** Cross-references the extracted Tax ID and Seller name with a verified database.
- **Rule Engine:** Validates the document against current Thai tax laws (e.g., SSF/RMF holding periods, Life Insurance minimum 10-year term, "Easy E-Receipt" date windows).

### 6. Storage & Results
Results are stored in a **PostgreSQL** database for history tracking and saved as local JSON records for quick access. Users can view, download, or export their deduction summaries.

---

## 📂 Project Structure

```text
smarttax/
├── frontend/                # Next.js Application
│   ├── src/app/             # Pages and Components
│   └── public/              # Static Assets
├── backend/                 # FastAPI Service
│   ├── database/            # DB Connection & Schema (PostgreSQL)
│   ├── model/               # Trained ML Models (.pkl)
│   ├── uploads/             # Temporary storage for uploaded files
│   ├── saved_records/       # JSON exports of processed results
│   ├── app.py               # Main API Entry Point
│   ├── ocr_flow.py          # OCR Logic
│   ├── extraction.py        # LLM Extraction Logic
│   ├── predict_category.py  # ML Classification Logic
│   └── condition.py         # Tax Rule Engine
└── README.md                # Project Documentation
```

---

## 🚀 Getting Started

### Backend Setup
1. Navigate to the `backend` directory.
2. Create a virtual environment: `python -m venv .venv`
3. Install dependencies: `pip install -r requirements.txt`
4. Set up your `.env` file with `TYPHOON_OCR_API_KEY` and Supabase credentials.
5. Run the server: `uvicorn app:app --reload`

### Frontend Setup
1. Navigate to the `frontend` directory.
2. Install dependencies: `npm install`
3. Run the development server: `npm run dev`

---

## 📝 Authors
- **Keingkrai Buakeaw**

---
*Disclaimer: This tool is intended for preliminary tax deduction checks. Please consult with a professional tax advisor or the Revenue Department for official filings.*
