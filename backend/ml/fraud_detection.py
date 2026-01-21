import pandas as pd
from sklearn.ensemble import IsolationForest

# Placeholder for user activity data
def fetch_user_activity():
    """
    Fetch user activity data for fraud detection.
    Replace this with actual database queries.
    """
    return pd.DataFrame({
        'user_id': [1, 2, 3, 4, 5],
        'login_count': [50, 3, 200, 1, 100],
        'messages_sent': [100, 2, 500, 0, 300],
        'skills_uploaded': [10, 1, 20, 0, 15],
    })

def detect_fraud(user_data):
    """
    Detect suspicious user activity using Isolation Forest.
    user_data: List of dictionaries containing 'login_count', 'messages_sent', 'skills_uploaded', 'user_id'
    """
    if not user_data:
        return []
        
    data = pd.DataFrame(user_data)
    
    if data.empty:
        return []

    # Use relevant features for fraud detection
    features = data[['login_count', 'messages_sent', 'skills_uploaded']]

    # Train Isolation Forest model
    model = IsolationForest(contamination=0.1, random_state=42)
    data['fraud_score'] = model.fit_predict(features)

    # Flag suspicious users
    data['fraud_score'] = model.fit_predict(features)
    suspicious_users = data[data['fraud_score'] == -1]
    
    return suspicious_users[['user_id', 'fraud_score']].to_dict(orient='records')

# Example usage
if __name__ == "__main__":
    try:
        flagged_users = detect_fraud()
        if flagged_users.empty:
            print("No suspicious activity detected.")
        else:
            print("Suspicious users detected:")
            print(flagged_users)
    except ValueError as e:
        print(e)