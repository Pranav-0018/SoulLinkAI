# Soul Link AI 💜

An emotionally intelligent, self-learning AI assistant landing page and companion chat application featuring real-time speech recognition, natural language processing (NLP), machine learning sentiment analysis, and a persistent memory vault.

---

## 🚀 Key Features

*   **Premium Glassmorphic Landing Page**: Built with modern dark-mode aesthetics, custom CSS variables, harmony color palettes, and smooth entry animations.
*   **Speech-to-Text Voice Input**: Integrates the browser's native `webkitSpeechRecognition` (Web Speech API) with real-time text transcription and silence auto-send detection.
*   **AI Memory Vault & Analytics Sidebar**:
    *   **Active Mood Badge**: Live updates representing the user's emotional state (Positive, Negative, Angry, Anxious, Neutral).
    *   **Remembered Facts**: Regular Expression-based NLP information extraction that parses key details (e.g., name, likes, feelings) and persists them in `localStorage` across page reloads.
    *   **Emotional Trends Chart**: Dynamically renders a SVG/CSS bar chart graphing the user's recent sentiment scores.
*   **Empathetic Response Engine**: Intent classification logic that detects requests for Stories, Songs, and Support, returning context-aware, comforting text replies.
*   **Hybrid / Fallback Architecture**: 
    *   **Online**: Connects to the local Python FastAPI backend using a trained Multinomial Naive Bayes classifier.
    *   **Offline**: Automatically falls back to a built-in, lightweight JavaScript lexicon sentiment analyzer with negation detection.

---

## 🛠️ Tech Stack & Algorithms

*   **Frontend**: HTML5 (Semantic Structure), Vanilla CSS3 (Glassmorphism & Micro-animations), JavaScript (ES6+ Modules, Web Speech API).
*   **Backend API**: Python 3, FastAPI, Uvicorn, Pydantic.
*   **Natural Language Processing**: NLTK (Tokenization, clean filters, lemmatization).
*   **Machine Learning Classifier**: scikit-learn (TF-IDF Vectorization, Multinomial Naive Bayes classification).

---

## 📂 Project Structure

```
SoulLinkAI/
│
├── index.html            # Core HTML structure (Landing page & Chat Companion)
├── styles.css            # Stylesheet containing design system, grids, and glows
├── app.js                # Frontend controller, speech integration, client-side NLP
├── README.md             # Project documentation (This file)
│
└── backend/
    ├── requirements.txt  # Python package dependencies
    ├── nlp_pipeline.py   # Preprocessing, lemmatization, and lexicon fallbacks
    ├── train_classifier.py# TF-IDF training script for the Naive Bayes model
    └── app.py            # FastAPI backend server with API endpoints
```

---

## ⚡ Setup & Run Instructions

### 1. Run the Web Interface (Zero Setup)
Simply open the `index.html` file inside Google Chrome or Microsoft Edge. The client-side lexicon will handle speech transcription and NLP sentiment analysis locally.

### 2. Run with the Python ML Server (Full Stack)
To run the full pipeline using the trained Naive Bayes machine learning model:

1.  **Navigate to the project directory**:
    ```bash
    cd D:\Desktop\SoulLinkAI
    ```
2.  **Install dependencies**:
    ```bash
    pip install -r backend/requirements.txt
    ```
3.  **Train the ML Model**:
    ```bash
    python backend/train_classifier.py
    ```
    *This processes the labeled dataset, generates features, and exports `model.pkl` and `vectorizer.pkl`.*
4.  **Start the FastAPI Server**:
    ```bash
    uvicorn backend.app:app --reload
    ```
    *The server will boot up on `http://127.0.0.1:8000`.*
5.  **Access the application**: Reload your `index.html` browser tab. The frontend will detect the local server and start routing text requests to the machine learning classifier.

---

## 🌐 Deployment

*   **Frontend (Static hosting)**: Can be deployed for free on **Vercel**, **Netlify**, or **GitHub Pages**.
*   **Backend (Python hosting)**: Can be hosted on **Render.com** or **Railway.app** as a Python Web Service. Set the startup command to:
    ```bash
    uvicorn backend.app:app --host 0.0.0.0 --port $PORT
    ```
    *Note: When deployed, update the `fetch()` URL inside `app.js` to point to your deployed backend domain.*
