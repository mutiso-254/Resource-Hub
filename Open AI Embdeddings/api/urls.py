from django.urls import path
from .views import CreateEmbeddings,SearchText

urlpatterns = [
    path('create_embeddings', CreateEmbeddings.as_view(), name="create_embeddings"),
    path('search_text', SearchText.as_view(), name="search_text"),
]
