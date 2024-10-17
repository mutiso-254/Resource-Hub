from rest_framework import generics
from rest_framework.response import Response
import os
from .functions import create_embeddings, cosine_similarity
import pandas as pd
from ast import literal_eval
import numpy as np

from pinecone import Pinecone
from pinecone import ServerlessSpec
import time
import json




openai_key = '*************************************************'
pinecone_key = '*************************************'






# Search Through Product Embeddings
class SearchProperties(generics.GenericAPIView):

  def post(self, request):

    question = request.data['text']
    # metadata = literal_eval(request.data['metadata'])
    metadata = request.data['metadata']
    embedding = create_embeddings(question)
    
    print("Metadata: ", metadata, " Metadata type: ", type(metadata))
    
    # Create function to transform metadata into usable filter dictionary
    

    
    def transform_metadata(metadata):
      filter_dict = {}
      for key, value in metadata.items():
        if key == "city":
          filter_dict[key] = {"$eq": value}
        if key == "state":
          filter_dict[key] = {"$eq": value}
        if key == "bedrooms":
          filter_dict[key] = {"$eq": value}
        if key == "bathrooms":
          filter_dict[key] = {"$eq": value}
        if key == "homeType":
          filter_dict[key] = {"$eq": value}
      return filter_dict
    
    metadata = transform_metadata(metadata)
        
    # Configure Pinecone Client
    pc = Pinecone(api_key=pinecone_key)   
    index_name = 'realestate-index'
    
    index = pc.Index(index_name)
    
    results = index.query(
        vector=embedding,
        top_k=3,  
        filter=metadata,
        include_metadata=True
    )
    
    print("Results: ", results.to_dict())
     
    return Response(results.to_dict())

  def get(self, request):
    return Response("Okay")


def clean_text(text):
  if isinstance(text, str):
    cleaned_text = text.strip()  # Remove leading and trailing whitespaces
    cleaned_text = cleaned_text.replace("\n", " ")  # Remove newline characters
    # Add additional cleaning steps if needed
    return cleaned_text
  else:
    return ''  # Replace NaN values with an empty string



# Create Embeddings
class CreateEmbeddings(generics.GenericAPIView):

  def get(self, request):

    x = self
  

    # Construct the absolute path to the Two CSV files
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, "Properties.csv")
    file_path2 = os.path.join(base_dir, "PropertiesEmbeddings.csv")

    # Obtain all the columns we will need to use
    df = pd.read_csv(file_path, index_col=0)
    df['city'] = df['city'].fillna('')
    df['streetAddress'] = df['streetAddress'].fillna('')
    df['homeType'] = df['homeType'].fillna('')
    df['description'] = df['description'].fillna('')
    df['bedrooms'] = df['bedrooms'].fillna('')
    df['bathrooms'] = df['bathrooms'].fillna('')

    
    df['combined'] = ("" + df['bedrooms'].apply(str) + " bedrooms" + \
                      "; " + df['bathrooms'].apply(str) + " bathrooms house"
                      "; Home Type: " + df['homeType'].apply(clean_text) + \
                      "; City: " + df['city'].apply(clean_text) + \
                      "; Description: " + df['description'].apply(clean_text) + \
                      "; Street Address: " + df['streetAddress'].apply(clean_text)
                     )
    
    # Create embeddings
    df['embedding'] = df['combined'].apply(lambda x: create_embeddings(x))
    df.to_csv(file_path2)

    return Response("Okay")


# Configure Pinecone
class ConfigurePinecone(generics.GenericAPIView):
  def get(self, request):
    

    pinecone_key = '************************************88'
    
    # Configure Pinecone Client
    pc = Pinecone(api_key=pinecone_key)
    spec = ServerlessSpec(cloud='aws', region='us-east-1')

    # Setup Pinecone Index
    index_name = 'realestate-index'
    dimensions = 1536

    pc.create_index(name=index_name, dimension=dimensions, spec=spec, metric="cosine")

    # wait for index to be ready before connecting
    while not pc.describe_index(index_name).status['ready']:
        time.sleep(1)
        

    # Connect to pinecone index 
    index = pc.Index(index_name)

    # Create Dataframe to upsert to pinecone index
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, "PropertiesEmbeddings.csv")

    df = pd.read_csv(file_path)

    df2 = pd.DataFrame()

    df2['id'] = df['zpid'].apply(str)
    df2['vector'] = df['embedding'].apply(lambda x: [float(i) for i in literal_eval(x)])
  

    
    df2['metadata'] = df.apply(lambda row: {
        "city": row['city'], 
        "state": row['state'], 
        "bedrooms": row['bedrooms'], 
        "bathrooms": row['bathrooms'],
        "homeType": row['homeType'],
        "description": row['description'],
        "streetAddress": row['streetAddress'],
    }, axis=1)


    # Upsert the vectors to pinecone
    index.upsert(vectors=zip(df2['id'], df2['vector'], df2['metadata']))
    
    return Response("Successfully configured Pinecone")
  
  
