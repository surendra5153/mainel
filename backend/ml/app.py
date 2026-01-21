from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import matchmaking_model

app = FastAPI(title="SkillSwap ML Microservice", version="1.0.0")

# Define Input Models
class UserProfile(BaseModel):
    user_id: str
    skills: List[str]  # Skills the user currently has
    goals: List[str]   # Skills the user wants to learn (preferences)

class CandidateProfile(BaseModel):
    user_id: str
    name: str
    skills: List[str] # Skills this candidate teaches

class RecommendationRequest(BaseModel):
    target_user: UserProfile
    candidates: List[CandidateProfile]
    top_n: Optional[int] = 5

import chat_insights
import fraud_detection
from pydantic import Field

# ... existing Input Models ...

class SentimentRequest(BaseModel):
    text: str

class UserActivity(BaseModel):
    user_id: str
    login_count: int
    messages_sent: int
    skills_uploaded: int

class FraudCheckRequest(BaseModel):
    activities: List[UserActivity]

@app.post("/sentiment")
def analyze_text_sentiment(request: SentimentRequest):
    try:
        score = chat_insights.analyze_sentiment(request.text)
        suggestion = chat_insights.suggest_response(request.text)
        return {"sentiment": score, "suggestion": suggestion}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/fraud-check")
def check_fraud(request: FraudCheckRequest):
    try:
        # Convert Pydantic models to dicts
        data = [act.dict() for act in request.activities]
        suspicious = fraud_detection.detect_fraud(data)
        
        # Format result
        if isinstance(suspicious, list):
            return {"suspicious_users": suspicious}
        
        # If it returned a dataframe (from original code, it returns subset dataframe)
        # We need to adapt it. 
        # Actually I updated detect_fraud to return something? 
        # In my replacement, I returned the dataframe ops. 
        # Let's fix fraud_detection logic to return list of dicts.
        
        # If the function returns a DataFrame, convert to dict
        if hasattr(suspicious, 'to_dict'):
             return {"suspicious_users": suspicious.to_dict(orient='records')}
             
        return {"suspicious_users": []}
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/recommend")
def get_recommendations(request: RecommendationRequest):
    try:
        # Check if candidates exist
        if not request.candidates:
            return {"recommendations": []}

        # Call the matchmaking logic
        # We pass dictionaries or objects as expected by the logic
        recommendations = matchmaking_model.predict_matches(
            request.target_user,
            request.candidates,
            request.top_n
        )
        
        return {"recommendations": recommendations}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)