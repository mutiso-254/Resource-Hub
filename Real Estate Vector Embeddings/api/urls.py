from .views import SearchProperties, CreateEmbeddings, ConfigurePinecone
from django.urls import path

urlpatterns = [
    path('search_properties', SearchProperties.as_view(), name='search_properties'),
    path('create_embeddings',
         CreateEmbeddings.as_view(),
         name='create_embeddings'),
    path('configure_pinecone',
         ConfigurePinecone.as_view(),
         name='configure_pinecone')
]