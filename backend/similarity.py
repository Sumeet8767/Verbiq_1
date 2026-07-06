from sentence_transformers import SentenceTransformer, util

model = SentenceTransformer('all-MiniLM-L6-v2')

def text_similarity(content_transcription,user_audio_transcription):
    # Load a pre-trained model (MiniLM is fast and good)

    # Compute embeddings
    content_embedding = model.encode(content_transcription, convert_to_tensor=True)
    users_embedding = model.encode(user_audio_transcription, convert_to_tensor=True)

    # Compute cosine similarity
    similarity = util.cos_sim(content_embedding, users_embedding)

    similarity_score = similarity.item()

    return similarity_score
