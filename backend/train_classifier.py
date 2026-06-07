import sys
import os
# Ensure the backend directory is in the python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import pickle
from nlp_pipeline import NLPPipeline

# Sample Training Dataset
training_data = [
    # Positive / Happy
    ("I am feeling so happy and joyful today!", "positive"),
    ("What a beautiful and wonderful day!", "positive"),
    ("I love this so much, it makes me smile.", "positive"),
    ("Everything is going great and I am glad.", "positive"),
    ("I feel calm, peaceful and content.", "positive"),
    ("That is fantastic news! I am excited.", "positive"),
    
    # Negative / Sad
    ("I feel so sad and lonely right now.", "negative"),
    ("I'm crying because I hurt inside.", "negative"),
    ("Everything feels hopeless and full of sorrow.", "negative"),
    ("I am down, depressed and feeling bad.", "negative"),
    ("It's a terrible, gloomy day.", "negative"),
    ("I feel miserable and heartbroken.", "negative"),
    
    # Angry
    ("I am so angry and furious at this!", "angry"),
    ("This makes me so mad and frustrated.", "angry"),
    ("I hate when this happens, it is annoying.", "angry"),
    ("I feel pissed and full of bitter rage.", "angry"),
    ("Stop bothering me, I am extremely irritated.", "angry"),
    ("He was hostile and offended me.", "angry"),
    
    # Anxious / Scared
    ("I feel anxious and nervous about tomorrow.", "anxious"),
    ("I am so scared and afraid of failing.", "anxious"),
    ("This situation makes me panic and worry.", "anxious"),
    ("I'm feeling very stressed, tense and insecure.", "anxious"),
    ("My heart is racing, I feel jittery and uneasy.", "anxious"),
    ("I fear what is going to happen next.", "anxious")
]

def train_and_save():
    pipeline = NLPPipeline()
    
    # Preprocess training texts
    preprocessed_texts = []
    labels = []
    
    for text, label in training_data:
        # Get preprocessed tokens and join back as a string
        tokens = pipeline.preprocess(text)
        preprocessed_texts.append(" ".join(tokens))
        labels.append(label)
        
    print(f"Loaded {len(training_data)} training examples.")
    
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.naive_bayes import MultinomialNB
        
        print("Scikit-learn is available. Training Multinomial Naive Bayes model...")
        
        # 1. Feature Extraction (TF-IDF)
        vectorizer = TfidfVectorizer()
        X_train = vectorizer.fit_transform(preprocessed_texts)
        
        # 2. Model Training (Naive Bayes)
        classifier = MultinomialNB()
        classifier.fit(X_train, labels)
        
        # Save artifacts
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        vectorizer_path = os.path.join(backend_dir, 'vectorizer.pkl')
        model_path = os.path.join(backend_dir, 'model.pkl')
        
        with open(vectorizer_path, 'wb') as f:
            pickle.dump(vectorizer, f)
        with open(model_path, 'wb') as f:
            pickle.dump(classifier, f)
            
        print(f"Model saved successfully to {model_path}")
        print(f"Vectorizer saved successfully to {vectorizer_path}")
        
    except ImportError:
        print("Scikit-learn not found. Creating a rule-based fallback model representation...")
        # Fallback dictionary-based classifier representation
        fallback_model = {
            "vocab": {},
            "classes": ["positive", "negative", "angry", "anxious"]
        }
        
        # Save a simple representation
        backend_dir = os.path.dirname(os.path.abspath(__file__))
        fallback_path = os.path.join(backend_dir, 'fallback_model.pkl')
        with open(fallback_path, 'wb') as f:
            pickle.dump(fallback_model, f)
        print("Fallback model saved.")

if __name__ == "__main__":
    train_and_save()
