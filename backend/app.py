# backend/app.py
import os
import pickle
import random
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

import sys
import os
# Ensure the backend directory is in the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from nlp_pipeline import NLPPipeline

app = FastAPI(
    title="Soul Link AI - NLP Backend",
    description="Empathetic emotional analysis and response generation system",
    version="1.0.0"
)

# Enable CORS for frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TextPayload(BaseModel):
    text: str
    user_name: str = ""

# Load NLP Pipeline
pipeline = NLPPipeline()

# Load Vectorizer and Model if they exist
vectorizer = None
classifier = None

backend_dir = os.path.dirname(os.path.abspath(__file__))
vectorizer_path = os.path.join(backend_dir, 'vectorizer.pkl')
model_path = os.path.join(backend_dir, 'model.pkl')

if os.path.exists(vectorizer_path) and os.path.exists(model_path):
    try:
        with open(vectorizer_path, 'rb') as f:
            vectorizer = pickle.load(f)
        with open(model_path, 'rb') as f:
            classifier = pickle.load(f)
        print("Successfully loaded Naive Bayes classifier and TF-IDF vectorizer!")
    except Exception as e:
        print(f"Error loading classifier: {e}. Falling back to rule-based lexicon.")
else:
    print("Pre-trained classifier not found. Falling back to rule-based lexicon.")

# RESPONSE UTILITIES
def get_story(name: str) -> str:
    stories = [
        f"Here is a short story for you{name}. 📖\n\nOnce upon a time, a tiny seed felt buried and hidden in the cold ground. It doubted it would ever feel the warm sun. But the rain kept watering it, and the earth held it tight. After a long winter, a green sprout pushed through the soil and blossomed into a gorgeous wildflower. Remember, dear friend, that sometimes when you feel buried, you are actually being planted.",
        f"Let me share a story of hope with you{name}. 🕯️\n\nA wanderer lost in a deep fog met a traveler carrying a small lantern. The wanderer asked, 'How can you walk in this thick mist? Your lantern only lights a single step.' The traveler replied, 'To cross the dark, you don't need to see the mountain. You only need to take the next step. As you step, the light moves with you.'\n\nDon't worry about tomorrow. Focus on your next step."
    ]
    return random.choice(stories)

def get_song(name: str) -> str:
    songs = [
        f"I wrote this melody for you{name}. 🎶\n\n*(Verse)*\nWhen the stars fade to grey\nAnd you can't find your way\nJust rest your head, it's okay\nWe will greet a brighter day...\n\n*(Chorus)*\nBreathe in the quiet, hold on to peace\nSoon the storms inside will cease\nYou are stronger than the wind that blows\nAnd more loved than anyone knows.",
        f"Here is a comforting tune{name}. 🎵\n\n*(Chorus)*\nIn this busy, crowded place\nLet me give you quiet space\nI'll remember all you say\nAnd chase your doubts and fears away\nYou're not alone, my dearest friend\nI'm with you to the very end."
    ]
    return random.choice(songs)

def generate_reply(text: str, sentiment: dict, name: str) -> str:
    mood = sentiment["mood"]
    lower_text = text.lower()
    
    # Intent detection
    if "story" in lower_text or "tale" in lower_text or "fable" in lower_text:
        return get_story(name)
    if "song" in lower_text or "sing" in lower_text or "lyrics" in lower_text:
        return get_song(name)
    
    name_str = f", {name}" if name else ""
    
    if mood == "positive":
        replies = [
            f"Your joy makes me happy{name_str}! 🌟 I love hearing about positive things. What made this moment so special?",
            f"That sounds wonderful{name_str}! 😊 It's great to celebrate these high points. Tell me more about what brought this smile to your face."
        ]
    elif mood == "negative":
        replies = [
            f"I hear how much pain you are in{name_str}. 💜 Please know that I'm right here with you, and it's okay to feel down. You are not alone in this.",
            f"I am so sorry you are going through this rough time{name_str}. Heavy emotions can be exhausting. Take all the time you need, I am listening."
        ]
    elif mood == "angry":
        replies = [
            f"It sounds like you're really angry and frustrated{name_str}. 😤 You have every right to feel that way. What is the main thing that triggered this feeling?",
            f"I hear you, and I understand your irritation. Feel free to vent it all out. I'm a safe boundary for your anger."
        ]
    elif mood == "anxious":
        replies = [
            f"Anxiety can feel like a storm in your chest{name_str}. Let's take a slow breath. You are safe here. What is the primary worry circling in your head?",
            f"I can feel the stress in your words{name_str}. Let's break things down together so it feels less overwhelming. What's the next small step we can handle?"
        ]
    else:
        replies = [
            f"I'm here for you{name_str}. Tell me more about what you're thinking or feeling. I'm ready to listen.",
            f"I see. That's really interesting{name_str}. How does that make you feel overall?"
        ]
    return random.choice(replies)

def extract_facts_python(text: str) -> list:
    facts = []
    # Basic Name extraction
    name_match = re.search(r"my name is\s+([A-Za-z]+)", text, re.IGNORECASE)
    if name_match:
        facts.append(f"Your name is {name_match.group(1)}")
        
    # Basic Like extraction
    like_match = re.search(r"i (like|love|enjoy)\s+([^.]+)", text, re.IGNORECASE)
    if like_match:
        facts.append(f"You love {like_match.group(2).strip()}")
        
    # Basic Feeling extraction
    feel_match = re.search(r"i feel\s+([^.]+)", text, re.IGNORECASE)
    if feel_match:
        facts.append(f"You feel {feel_match.group(1).strip()}")
        
    return facts

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "Soul Link AI NLP Backend",
        "endpoints": {
            "/api/analyze": "POST - Analyze text sentiment, intent, and generate empathetic replies."
        }
    }

@app.post("/api/analyze")
def analyze_text(payload: TextPayload):
    text = payload.text
    if not text.strip():
        raise HTTPException(status_code=400, detail="Text payload cannot be empty.")
        
    # Preprocess text
    lemmas = pipeline.preprocess(text)
    
    # Analyze Sentiment
    # If classifier is loaded, use it. Otherwise, use lexicon fallback
    if classifier and vectorizer:
        try:
            # Reconstruct string of preprocessed words for TF-IDF vectorizer
            processed_str = " ".join(lemmas)
            X = vectorizer.transform([processed_str])
            prediction = classifier.predict(X)[0]
            
            # Re-verify valence score for meter positioning
            lexicon_sentiment = pipeline.analyze_sentiment(text)
            sentiment = {
                "score": lexicon_sentiment["score"],
                "mood": prediction
            }
        except Exception as e:
            print(f"Prediction failed, falling back to rule-based: {e}")
            sentiment = pipeline.analyze_sentiment(text)
    else:
        sentiment = pipeline.analyze_sentiment(text)
        
    # Extract name and facts
    facts = extract_facts_python(text)
    
    # Generate Reply
    reply = generate_reply(text, sentiment, payload.user_name)
    
    return {
        "text": text,
        "tokens": pipeline.tokenize(text),
        "lemmas": lemmas,
        "sentiment": sentiment,
        "empathetic_response": reply,
        "extracted_facts": facts
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
