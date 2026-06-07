# backend/nlp_pipeline.py
import re
import string

# Try importing nltk, download resources if missing, but fallback gracefully if offline
try:
    import nltk
    from nltk.corpus import stopwords
    from nltk.stem import WordNetLemmatizer
    
    # Download required NLTK resources silently
    nltk.download('stopwords', quiet=True)
    nltk.download('wordnet', quiet=True)
    nltk.download('omw-1.4', quiet=True)
    
    STOPWORDS = set(stopwords.words('english'))
    LEMMATIZER = WordNetLemmatizer()
    HAS_NLTK = True
except Exception:
    HAS_NLTK = False
    # Fallback basic stopword set
    STOPWORDS = {
        'i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', "you're", "you've", "you'll", "you'd",
        'your', 'yours', 'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', "she's", 'her', 'hers',
        'herself', 'it', "it's", 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which',
        'who', 'whom', 'this', 'that', "that'll", 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 'been',
        'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'and', 'but', 'if',
        'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between',
        'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out',
        'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once'
    }
    LEMMATIZER = None

class NLPPipeline:
    def __init__(self):
        self.stopwords = STOPWORDS
        self.lemmatizer = LEMMATIZER
        
        # Core Sentiment Lexicons
        self.positive_lexicon = {
            'happy', 'joyful', 'excited', 'peaceful', 'glad', 'great', 'amazing', 'love', 
            'wonderful', 'smile', 'good', 'nice', 'optimistic', 'hopeful', 'blessed', 'calm'
        }
        self.negative_lexicon = {
            'sad', 'lonely', 'depressed', 'blue', 'down', 'hurt', 'cry', 'grief', 
            'hopeless', 'sorrow', 'bad', 'terrible', 'painful', 'gloomy', 'unhappy'
        }
        self.angry_lexicon = {
            'angry', 'mad', 'furious', 'annoyed', 'frustrated', 'pissed', 'rage', 'hate', 
            'irritated', 'upset', 'bitter', 'offended'
        }
        self.anxious_lexicon = {
            'anxious', 'nervous', 'scared', 'afraid', 'worried', 'panic', 'fear', 'stressed', 
            'tense', 'insecure'
        }
        self.negations = {'not', 'no', 'never', 'dont', 'cant', 'wasnt', 'wont', 'isnt'}

    def clean_text(self, text: str) -> str:
        """
        Removes special characters, numbers and converts to lowercase
        """
        text = text.lower()
        # Remove punctuation
        text = text.translate(str.maketrans('', '', string.punctuation))
        # Remove numbers
        text = re.sub(r'\d+', '', text)
        return text.strip()

    def tokenize(self, text: str) -> list:
        """
        Tokenizes the clean text into words
        """
        clean_text = self.clean_text(text)
        return clean_text.split()

    def remove_stopwords(self, tokens: list) -> list:
        """
        Removes standard english stopwords
        """
        return [t for t in tokens if t not in self.stopwords]

    def lemmatize(self, tokens: list) -> list:
        """
        Applies lemmatization (normalizing words to root form)
        """
        if HAS_NLTK and self.lemmatizer:
            return [self.lemmatizer.lemmatize(t) for t in tokens]
        
        # Simple basic suffix stripper fallback
        lemmas = []
        for token in tokens:
            if token.endswith('ing') and len(token) > 5:
                lemmas.append(token[:-3])
            elif token.endswith('ed') and len(token) > 4:
                lemmas.append(token[:-2])
            elif token.endswith('es') and len(token) > 4:
                lemmas.append(token[:-2])
            elif token.endswith('s') and len(token) > 3 and not token.endswith('ss'):
                lemmas.append(token[:-1])
            else:
                lemmas.append(token)
        return lemmas

    def preprocess(self, text: str) -> list:
        """
        Full Preprocessing Pipeline: Clean -> Tokenize -> Stopwords -> Lemmatize
        """
        tokens = self.tokenize(text)
        tokens_no_stop = self.remove_stopwords(tokens)
        lemmatized_tokens = self.lemmatize(tokens_no_stop)
        return lemmatized_tokens

    def analyze_sentiment(self, text: str) -> dict:
        """
        Rule-based sentiment score and class based on preprocessed tokens and negations.
        """
        tokens = self.tokenize(text)
        
        pos_score = 0
        neg_score = 0
        angry_score = 0
        anxious_score = 0
        
        negation_active = False
        
        for token in tokens:
            if token in self.negations:
                negation_active = True
                continue
            
            # Reset negation context if we see coordinating words or punctuation (already stripped here though)
            multiplier = -1 if negation_active else 1
            negation_active = False # consume negation
            
            if token in self.positive_lexicon:
                if multiplier > 0: pos_score += 1
                else: neg_score += 1
            elif token in self.negative_lexicon:
                if multiplier > 0: neg_score += 1
                else: pos_score += 1
            elif token in self.angry_lexicon:
                if multiplier > 0: angry_score += 1
                else: pos_score += 1
            elif token in self.anxious_lexicon:
                if multiplier > 0: anxious_score += 1
                else: pos_score += 1

        total = pos_score + neg_score + angry_score + anxious_score
        if total == 0:
            return {"score": 0.0, "mood": "neutral"}
            
        score = (pos_score - neg_score) / total
        
        # Decide mood
        max_val = max(pos_score, neg_score, angry_score, anxious_score)
        if max_val == 0:
            mood = "neutral"
        elif max_val == pos_score:
            mood = "positive"
        elif max_val == neg_score:
            mood = "negative"
        elif max_val == angry_score:
            mood = "angry"
        elif max_val == anxious_score:
            mood = "anxious"
        else:
            mood = "neutral"
            
        return {
            "score": float(score),
            "mood": mood
        }

if __name__ == "__main__":
    # Test execution
    pipeline = NLPPipeline()
    sample_text = "I am not happy, I feel very lonely and sad!"
    print("Tokens:", pipeline.tokenize(sample_text))
    print("Preprocessed Lemmas:", pipeline.preprocess(sample_text))
    print("Sentiment Analysis:", pipeline.analyze_sentiment(sample_text))
