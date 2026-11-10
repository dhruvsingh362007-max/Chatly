# AI-Based Smart Parking Violation Assistant (ParkWise AI)

An intelligent, explainable AI-powered parking compliance and dispute web application designed for university computer science and engineering (CSE) demonstrations.

---

## 🚀 Live Local Access
The development server is running locally:
👉 **[http://127.0.0.1:3000](http://127.0.0.1:3000)** (or [http://127.0.0.1:3001](http://127.0.0.1:3001))

---

## 🎨 Modern SaaS Dashboard Architecture
- **Layout:** Two-column responsive SaaS interface with deep navy sidebar (`#0B192C`) and horizontal search header.
- **Background:** Clean slate-50 (`#F8FAFC`) with high-contrast typography and subtle bordered cards.
- **Compact Metric Cards:** Minimalist KPI cards displaying active citations, outstanding fines in INR, AI confidence, and enforcement zones.
- **Responsive Drawer:** Collapsible navigation drawer on mobile and tablet displays.

---

## 🇮🇳 Localization & Indian Demonstration Dataset
- **Currency:** Indian Rupee (₹) utilized across all fine calculations, fee breakdowns, and statistics.
- **Vehicle Registration Format:** Standard Indian RTO format (e.g. `PB10AB1234`, `DL01CZ4592`, `MH12DE8831`, `HR26DQ1109`).
- **Demonstration Locations:** Realistic Indian urban corridors:
  - *Mall Road, Near Clock Tower, Ludhiana*
  - *Connaught Place (Inner Circle), New Delhi*
  - *Cyber Hub Parking Deck, Gurugram*
  - *MG Road, Near Metro Pillar #124, Bengaluru*
  - *FC Road, Near Goodluck Chowk, Pune*
- **Configurable Sample Parking Guidelines:** Clearly labeled as demonstration benchmarks (e.g., `Rule PR-101: Commercial Curbside Window`, `Rule PR-102: Yellow Kerb Clearance`, `Rule PR-103: Emergency Gate Clearance`, `Rule PR-104: EV Charging Bay Compliance`).

---

## 🤖 AI Assistant ("ParkWise AI")
- **Greeting Handling:** Clean, direct, and polite responses for greetings ("Hi", "Hello", "Namaste", "Good morning") without generating unsolicited legal explanations.
- **Source & Reference Citations:** Every rule-based response contains a structured `Source / Reference Benchmark` card identifying the sample guideline.
- **RAG & Gemini API Ready:** Structured retriever (`ragRetriever`) and modular prompt synthesizer (`synthesizeResponse`) designed for direct drop-in integration with Google GenAI / Gemini 1.5 Flash.
- **Zero Hallucinated Laws:** Explicitly avoids fabricating statutory acts or government policies, identifying all rules as sample demo benchmarks.

---

## 🏛️ Municipal Admin Console
- **Officer Identity:** Inspector Rakesh Verma (`IN-TC-402`), Municipal Parking Compliance Cell.
- **Dispute Adjudication:** Review driver appeal briefs with AI merit scores, approve fine dismissals (₹0), or reject with notes.
- **Rule Management UI:** Toggle active/suspended enforcement, edit rule parameters (fine amount, grace minutes, active hours), and configure new guidelines.
- **Field Reports:** Crowdsourced parking reports with simulated Indian license plate OCR pre-scans.
