from django.contrib import admin
from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()
router.register('login', LoginViewset, basename='login')
router.register('password', PasswordSetup, basename='password')
router.register('clustering', ClusteringViewSet, basename='clustering')
router.register('guide-allocation', GuideAllocationViewSet, basename='guide-allocation')
router.register('pdf',CustomModelViewSet,basename='pdf')
router.register('domains',DomainViewSet,basename='domains')
router.register('teacherpreferences',TeacherPreferenceViewSet,basename='teacherpreferences')
router.register('student',StudentViewSet,basename='student')
router.register('teacher',TeacherViewSet,basename='teacher')
router.register('studentslist',StudentSet,basename='studentslist')
router.register('batches',BatchViewSet,basename='batches')
router.register('years',YearViewSet,basename='year')
router.register('user', UserViewSet, basename='user')
router.register('semesters', SemViewSet, basename='semesters')
router.register('projects', ProjectViewSet, basename='projects')
router.register('projectpreference', ProjectPreferenceViewSet, basename='projectpreference')
router.register('publications', PublicationViewSet, basename='publications')
router.register('copyrights', CopyrightViewSet, basename='copyrights')
router.register('patents', PatentViewSet, basename='patents')
router.register('review', ReviewViewSet, basename='review')
router.register('event', AssessmentEventViewSet, basename='event')
router.register('week', WeekViewSet, basename='week')
router.register('task', ProjectTaskViewSet, basename='task')
router.register('student-profile', StudentProfileViewSet, basename='student-profile')
router.register('teacher-profile', TeacherProfileViewSet, basename='teacher-profile')
router.register('assessment', AssessmentViewSet, basename='assessment')
router.register('project-assessment', ProjectAssessmentViewSet, basename='project-assessment')
router.register('resources', UploadViewSet, basename='resources')
router.register('materials', ResourceViewSet, basename='materials')
router.register('links', LinkViewSet, basename='links')
router.register('upload_links', UploadLinkViewSet, basename='upload_links')
router.register('student-uploads', LinkUploadViewSet, basename='student-uploads')
router.register('departments', DepartmentViewSet, basename='departments')
router.register('designation', DesignationViewSet, basename='designation')
router.register('managementpermission', ManagementPermissionViewSet, basename='managementpermission')


urlpatterns = router.urls
