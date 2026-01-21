import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

def predict_matches(target_user, candidates, top_n=5):
    """
    Recommends mentors from the candidate list based on semantic similarity
    between target user's goals and candidates' skills.
    
    Args:
        target_user: Pydantic model or dict with 'goals'
        candidates: List of Pydantic models or dicts with 'skills', 'user_id', 'name'
        top_n: Number of recommendations to return
    """
    
    # 1. Prepare Data
    # Target Goal String: What the user wants to learn
    target_goals_text = " ".join(target_user.goals) if target_user.goals else ""
    
    if not target_goals_text:
        # If user has no goals, return popular or random (fallback)
        # For now, just return top candidates as is
        return [c.dict() for c in candidates[:top_n]]

    candidate_data = []
    for cand in candidates:
        # Candidate Skill String: What they teach
        skills_text = " ".join(cand.skills) if cand.skills else ""
        candidate_data.append({
            "user_id": cand.user_id,
            "name": cand.name,
            "skills_text": skills_text,
            "original_object": cand
        })

    df = pd.DataFrame(candidate_data)
    
    if df.empty:
        return []

    # 2. Vectorization
    # We include the target goals in the corpus to fit the vectorizer
    all_texts = [target_goals_text] + df["skills_text"].tolist()
    
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(all_texts)
    
    # 3. Compute Similarity
    # The first vector (index 0) is the target user
    # The rest are candidates
    target_vector = tfidf_matrix[0:1]
    candidate_vectors = tfidf_matrix[1:]
    
    similarity_scores = cosine_similarity(target_vector, candidate_vectors).flatten()
    
    # 4. Rank Candidates
    df["score"] = similarity_scores
    df = df.sort_values(by="score", ascending=False)
    
    # 5. Format Output
    top_candidates = df.head(top_n)
    
    results = []
    for _, row in top_candidates.iterrows():
        results.append({
            "user_id": row["user_id"],
            "name": row["name"],
            "score": round(float(row["score"]), 4),
            "matched_skills": row["skills_text"] # Optional: strictly existing fields?
        })
        
    return results