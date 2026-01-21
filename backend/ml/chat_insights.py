import nltk
from nltk.sentiment import SentimentIntensityAnalyzer

# Download NLTK data (only needs to be done once)
nltk.download('vader_lexicon')

# Initialize sentiment analyzer
sia = SentimentIntensityAnalyzer()

def analyze_sentiment(message):
    """
    Analyze the sentiment of a chat message.
    Returns a dictionary with sentiment scores (positive, neutral, negative, compound).
    """
    return sia.polarity_scores(message)

def suggest_response(message):
    """
    Suggest a response based on the sentiment of the message.
    """
    sentiment = analyze_sentiment(message)
    if sentiment['compound'] > 0.5:
        return "I'm glad to hear that! How can I assist you further?"
    elif sentiment['compound'] < -0.5:
        return "I'm sorry to hear that. Is there anything I can do to help?"
    else:
        return "Thank you for sharing. Let me know how I can assist."

# Example usage
if __name__ == "__main__":
    test_message = "I'm really happy with the service!"
    print("Message:", test_message)
    print("Sentiment Analysis:", analyze_sentiment(test_message))
    print("Suggested Response:", suggest_response(test_message))