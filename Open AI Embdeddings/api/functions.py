import requests
import json
import openai
from ast import literal_eval
import numpy as np

openai_key = 'sk-*******************************'
openai.api_key = openai_key


def create_embeddings(query, **kwargs):
    query = query.replace("\n", " ")

    response = openai.embeddings.create(input=[query],
                                        model="text-embedding-3-small",
                                        **kwargs)
    return response.data[0].embedding



def create_embeddings2(query):
    query = query
    embeddings_url = "https://api.openai.com/v1/embeddings"
    headers = {
        'Authorization': f'Bearer {openai_key}',
        'Content-Type': 'application/json'
    }

    data = {"model": "text-embedding-3-small", "input": query}

    # Convert Data into JSON String
    json_data = json.dumps(data)

    # Make API Call to create embeddings
    response = requests.post(embeddings_url, headers=headers, data=json_data)
    response_json = response.json().get('data')[0].get('embedding')

    return response_json



def cosine_similarity(a, b):
  return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))