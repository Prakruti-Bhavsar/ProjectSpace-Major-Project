from django.contrib import admin
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register('login', LoginViewset, basename='login')
router.register('clustering', ClusteringViewSet, basename='clustering')
router.register('guide-allocation', GuideAllocationViewSet, basename='guide-allocation')
router.register('pdf',CustomModelViewSet,basename='pdf')
urlpatterns = router.urls
