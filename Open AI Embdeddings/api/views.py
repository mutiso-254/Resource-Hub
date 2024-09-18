from rest_framework import generics
from rest_framework.response import Response
import os
from .functions import create_embeddings, cosine_similarity
import pandas as pd
from ast import literal_eval
import numpy as np


# API To Create the Embeddings
class CreateEmbeddings(generics.GenericAPIView):
    def get(self, request):

        # Construct the absolute path to the Two CSV files
        base_dir = os.path.dirname(os.path.abspath(__file__))
        file_path = os.path.join(base_dir, "Embeddings.csv")

        # Obtain all the columns we will need to use
        df = pd.read_csv(file_path, index_col=False)

        print("Heres the dataframe mister: ", df)
        print("Here are the columns: ",df.columns.tolist())
    
        
        # Create embeddings
        df["embedding"] = df["Text"].apply(lambda x: create_embeddings(x))
        df.to_csv(file_path)

        return Response("Okay")


# API To Perform The Search
class SearchText(generics.GenericAPIView):

  def post(self, request):

    question = request.data['text']
    embedding = create_embeddings(question)

    # print("Here is the questions embedding: ", embedding)

    
    # Load the dataset
    base_dir = os.path.dirname(os.path.abspath(__file__))
    file_path = os.path.join(base_dir, "Embeddings.csv")
    
    df = pd.read_csv(file_path)
    df["embedding"] = df.embedding.apply(literal_eval).apply(np.array) 
    # UFuncNoLoopError: ufunc 'multiply' did not contain a loop with signature matching types
    
    # Perform the search
    df["similarity"] = df["embedding"].apply(
        lambda x: cosine_similarity(x, embedding))
    
    results = df.sort_values("similarity", ascending=False).head(3)
    results = results["Text"]  # Return the text that is similar

    return Response(results.tolist())

