import re
from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from .serializers import *
from .models import *
from rest_framework.response import Response
from django.db import transaction, IntegrityError, connection
from django.contrib.auth.models import User
from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from knox.models import AuthToken
from rest_framework.decorators import action, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
import traceback
from django.views.decorators.csrf import csrf_exempt
from sklearn.cluster import AgglomerativeClustering
from sklearn.manifold import TSNE
from sklearn.preprocessing import StandardScaler
from collections import defaultdict
import numpy as np
import pandas as pd
from django.db.models import Q, Count
from django.db.models import Max, Subquery, OuterRef
from django.db.models import Count
import json
import random 
from functools import partial
from .genetic_algorithm import run_evolution, generate_population, fitness, Teachers, Group
from .genetic_algorithm_mini import evolution, population, fitness_func, Guide, Projects

from django.http import HttpResponse
from reportlab.lib.pagesizes import landscape, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageTemplate, Frame, PageBreak, FrameBreak, NextPageTemplate
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.utils import ImageReader
from reportlab.lib.enums import TA_CENTER

import logging


import xlsxwriter
from io import BytesIO
import os
from django.conf import settings

from .weekly_tasks import PREDEFINED_TASKS_BY_SEM

logger = logging.getLogger(__name__)

class LoginViewset(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = LoginSerializer

    def create(self, request): 
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid(): 
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']
            user = authenticate(request, username=username, password=password)
            if user: 
                _, token = AuthToken.objects.create(user)

                role = "unknown"
                if Student.objects.filter(user=user).exists():
                    role = "student"
                elif Teacher.objects.filter(user=user).exists():
                    role = "teacher"

                return Response(
                    {
                        "user": self.serializer_class(user).data,
                        "token": token,
                        "role": role,
                    }, status=status.HTTP_200_OK
                )
            else: 
                return Response({"error":"Invalid credentials"}, status=status.HTTP_401_UNAUTHORIZED)    
        else: 
            return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
        
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .serializers import SetPasswordSerializer

User = get_user_model()

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer

class DesignationViewSet(viewsets.ModelViewSet):
    queryset = Designation.objects.all()
    serializer_class = DesignationSerializer

class ManagementPermissionViewSet(viewsets.ModelViewSet):
    queryset = ManagementPermission.objects.all()
    serializer_class = ManagementPermissionSerializer

    def create(self, request, *args, **kwargs):
        teacher_id = request.data.get('teacher_id')
        if ManagementPermission.objects.filter(teacher_id=teacher_id).exists():
            return Response({"detail": "Access already granted."}, status=400)
        return super().create(request, *args, **kwargs)
    
    @action(detail=False, methods=["get"], url_path="check-access")
    def check_access(self, request):
        user = request.user

        try:
            teacher = Teacher.objects.get(user=user)
        except Teacher.DoesNotExist:
            return Response({"detail": "Only teachers can access this."}, status=status.HTTP_403_FORBIDDEN)

        has_access = ManagementPermission.objects.filter(teacher=teacher).exists()

        if has_access:
            return Response({"has_access": True}, status=status.HTTP_200_OK)
        else:
            return Response({"detail": "You are not allowed to access this page. You need permission."},
                            status=status.HTTP_403_FORBIDDEN)


class PasswordSetup(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = SetPasswordSerializer

    @action(detail=False, methods=['post'], url_path='set-password')
    @transaction.atomic
    def set_password(self, request):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            username = serializer.validated_data['username']
            password = serializer.validated_data['password']

            try:
                user = User.objects.get(username=username)
            except User.DoesNotExist:
                return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

            user.set_password(password)
            user.save()

            return Response({"detail": "Password updated successfully."})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class ClusteringViewSet(viewsets.ModelViewSet):
    serializer_class = SemSerializer
    @action(detail=False, methods=['post'])
    @transaction.atomic
    def cluster_and_allocate(self, request):
        def group_allocation_major(panel, groups, teachers):
            group_panel_assignment = defaultdict(list)
            unallocated_groups = []

            total_groups = len(groups)
            num_panels = len(panel)
            groups_per_panel = total_groups // num_panels + (1 if total_groups % num_panels else 0)
            panel_count = {panel_id: 0 for panel_id in panel}

            for group in groups:
                assigned = False
                guide = group.get("Guide")
                co_guide = group.get("CoGuide")
                domain = group.get("Domain")

                for panel_id, panel_teachers in panel.items():
                    if panel_count[panel_id] >= groups_per_panel:
                        continue

                    if guide in panel_teachers:
                        if any(t != guide and domain in teachers.get(t, []) for t in panel_teachers):
                            group_panel_assignment[panel_id].append(group)
                            panel_count[panel_id] += 1
                            assigned = True
                            break

                    elif co_guide in panel_teachers:
                        if any(t not in [guide, co_guide] and domain in teachers.get(t, []) for t in panel_teachers):
                            group_panel_assignment[panel_id].append(group)
                            panel_count[panel_id] += 1
                            assigned = True
                            break

                if not assigned:
                    unallocated_groups.append(group)

            # Try assigning based only on domain match (fallback)
            still_unallocated = []
            for group in unallocated_groups:
                assigned = False
                domain = group["Domain"]
                for panel_id, panel_teachers in panel.items():
                    if panel_count[panel_id] < groups_per_panel:
                        if any(domain in teachers.get(t, []) for t in panel_teachers):
                            group_panel_assignment[panel_id].append(group)
                            panel_count[panel_id] += 1
                            assigned = True
                            break
                if not assigned:
                    still_unallocated.append(group)

            return group_panel_assignment, still_unallocated

        # def group_allocation_regular(panel, groups):
        #     group_panel_assignment = defaultdict(list)
        #     total_groups = len(groups)
        #     num_panels = len(panel)
        #     groups_per_panel = total_groups // num_panels + (1 if total_groups % num_panels else 0)
        #     panel_count = {panel_id: 0 for panel_id in panel}

        #     for group in groups:
        #         assigned = False
        #         for panel_id, panel_teachers in panel.items():
        #             if panel_count[panel_id] < groups_per_panel and group["Guide"] in panel_teachers:
        #                 group_panel_assignment[panel_id].append(group)
        #                 panel_count[panel_id] += 1
        #                 assigned = True
        #                 break

        #         if not assigned:
        #             for panel_id, panel_teachers in panel.items():
        #                 if panel_count[panel_id] < groups_per_panel:
        #                     group_panel_assignment[panel_id].append(group)
        #                     panel_count[panel_id] += 1
        #                     break

        #     return group_panel_assignment, []

        # def group_allocation_regular(panel, groups, teachers):
        #     group_panel_assignment = defaultdict(list)
        #     unallocated_groups = []

        #     total_groups = len(groups)
        #     num_panels = len(panel)
        #     groups_per_panel = total_groups // num_panels + (1 if total_groups % num_panels else 0)
        #     panel_count = {panel_id: 0 for panel_id in panel}

        #     for group in groups:
        #         assigned = False
        #         guide = group["Guide"]

        #         for panel_id, panel_teachers in panel.items():
        #             if panel_count[panel_id] >= groups_per_panel:
        #                 continue

        #             if guide in panel_teachers:
        #                 group_panel_assignment[panel_id].append(group)
        #                 panel_count[panel_id] += 1
        #                 assigned = True
        #                 break

        #         if not assigned:
        #             group_panel_assignment[min(panel_count, key=panel_count.get)].append(group)

        #     return group_panel_assignment, []  
        def group_allocation_regular(panel, groups, teachers):
            group_panel_assignment = defaultdict(list)
            unallocated_groups = []

            total_groups = len(groups)
            num_panels = len(panel)
            groups_per_panel = total_groups // num_panels + (1 if total_groups % num_panels else 0)
            panel_count = {panel_id: 0 for panel_id in panel}

            for group in groups:
                assigned = False
                guide = group["Guide"]

                for panel_id, panel_teachers in panel.items():
                    if panel_count[panel_id] >= groups_per_panel:
                        continue

                    if guide in panel_teachers:
                        group_panel_assignment[panel_id].append(group)
                        panel_count[panel_id] += 1
                        assigned = True
                        break

                if not assigned:
                    target_panel = min(panel_count, key=panel_count.get)
                    group_panel_assignment[target_panel].append(group)
                    panel_count[target_panel] += 1  

            return group_panel_assignment, [] 

        try:
            payload = request.data.get('payload', {})
            year = payload['year']
            event_name = payload['eventName']
            rubrics = payload.get("rubrics", [])
            use_previous_panel = payload.get('usePreviousPanel','no')
            previous_event_id = payload.get('previousEventId',"")
            sem = payload['semester']
            div = payload['div']
            num_panels_raw = payload.get('noOfPanels','0') or '0'
            teachers_per_panel_raw = payload.get('noOfTeachers','0') or '0'
            option = payload.get('teachers',"")

            try:
                num_panels = int(num_panels_raw)
                teachers_per_panel = int(teachers_per_panel_raw)
            except ValueError:
                return Response({"error": "Invalid panel or teacher count provided."}, status=status.HTTP_400_BAD_REQUEST)
           
            y = Year.objects.get(id=year)
            if not y:
                return Response({"error": f"Year not found for department"}, status=status.HTTP_400_BAD_REQUEST)
            print(y)

            if sem == "Major Project":
                projects = Project.objects.filter(sem__sem=sem, sem__year__id=year)
            else:
                if div == "All":
                    projects = Project.objects.filter(sem__sem=sem, sem__year__id=year)
                else:
                    projects = Project.objects.filter(sem__sem=sem, sem__year__id=year, div=div)
            
            if use_previous_panel == "yes":
                print("enetered")
                try:
                    prev_event = AssessmentEvent.objects.get(id=previous_event_id)
                except AssessmentEvent.DoesNotExist:
                    return Response({"error": "Previous event not found."}, status=status.HTTP_400_BAD_REQUEST)

                new_event = AssessmentEvent.objects.create(name=event_name, year=y)

                if rubrics and isinstance(rubrics, list):
                    for rubric in rubrics:
                        name = rubric.get('name')
                        max_marks = rubric.get('maxMarks')

                        if name and max_marks:
                            try:
                                max_marks = int(max_marks)
                            except ValueError:
                                continue  # skip invalid marks

                            AssessmentRubric.objects.create(
                                event=new_event,
                                name=name,
                                max_marks=max_marks
                            )

                prev_panels = AssessmentPanel.objects.filter(event=prev_event)
                panel_dict = {}
                for old_panel in prev_panels:
                    new_panel = AssessmentPanel.objects.create(event=new_event, panel_number=old_panel.panel_number)
                    new_panel.teachers.set(old_panel.teachers.all())
                    new_panel.groups.set([]) 
                    panel_dict[new_panel.id] = list(old_panel.teachers.all())
                
                prev_unassigned_teachers = UnassignedTeacher.objects.filter(event=prev_event)
                for unassigned in prev_unassigned_teachers:
                    UnassignedTeacher.objects.create(event=new_event, teacher=unassigned.teacher)

                # Build teacher domain expertise map
                teacher_domains = {}
                for teacher in Teacher.objects.all():
                    domains = list(teacher.teacherpreference_set.select_related('domain').values_list('domain__name', flat=True))
                    teacher_domains[teacher] = domains

                # Build group objects list
                group_objs = []
                for project in projects:
                    domain_name = project.domain.name if project.domain else ""
                    group_objs.append({
                        "obj": project,
                        "Guide": project.project_guide,
                        "CoGuide": project.project_co_guide,
                        "Domain": domain_name,
                    })

               
                # Use allocation function
                if sem == "Major Project":
                    assigned, unassigned = group_allocation_major(panel_dict, group_objs, teacher_domains)
                else:
                    assigned, unassigned = group_allocation_regular(panel_dict, group_objs, teacher_domains)

                # Assign projects to panels
                for panel_id, group_list in assigned.items():
                    panel_obj = AssessmentPanel.objects.get(id=panel_id)
                    for group in group_list:
                        panel_obj.groups.add(group["obj"])

                # Save unassigned groups
                for group in unassigned:
                    UnassignedGroup.objects.create(event=new_event, group=group["obj"])
                return Response({"message": "Panels copied and projects assigned."}, status=status.HTTP_200_OK)
            else:
                all_teacher_ids = set(Teacher.objects.filter(department=y.department).values_list("user__id", flat=True))

                if div == "All" or sem == "Major Project":
                    guide_ids = ProjectGuide.objects.filter(sem__sem=sem, sem__year=y).values_list("teacher__user__id", flat=True)
                    co_guide_ids = Project.objects.filter(sem__sem=sem, sem__year=y, project_co_guide__isnull=False).values_list("project_co_guide__user__id", flat=True)
                else:
                    guide_ids = ProjectGuide.objects.filter(sem__sem=sem, sem__year=y, sem__div=div).values_list("teacher__user__id", flat=True)
                    co_guide_ids = Project.objects.filter(sem__sem=sem, sem__year=y, sem__div=div, project_co_guide__isnull=False).values_list("project_co_guide__user__id", flat=True)
                print(list(guide_ids))
                print(list(co_guide_ids))
                if option == "guide":
                    selected_teacher_ids = set(guide_ids)
                elif option == "guide and co-guide":
                    selected_teacher_ids = set(guide_ids).union(set(co_guide_ids))
                elif option == "all":
                    selected_teacher_ids = all_teacher_ids
                print(selected_teacher_ids)
                
                
                if sem == "Major Project":   
                    teachers = defaultdict(list)
            
                    teacher_prefs = TeacherPreference.objects.select_related('teacher__user', 'domain') \
                        .filter(teacher__user__id__in=selected_teacher_ids).order_by('preference_rank')
                    
                    for pref in teacher_prefs:
                        title= pref.teacher.title
                        first_name = pref.teacher.user.first_name
                        middle_name = pref.teacher.middle_name or ""  
                        last_name = pref.teacher.user.last_name

                        full_name = f"{title} {first_name} {middle_name + ' ' if middle_name else ''}{last_name}"
                        
                        domain_name = pref.domain.name
                        teachers[pref.teacher.user.username].append(domain_name)
                   
                    groups = []

                    for project in projects:
                        
                        domain_name = project.domain.name if project.domain else "Unknown Domain"
                        guide_name = f"{project.project_guide.title} {project.project_guide.user.first_name} {project.project_guide.middle_name + ' ' if project.project_guide.middle_name else ''}{project.project_guide.user.last_name}" if project.project_guide else "No Guide Assigned"

                        groups.append({
                            "Group": project.id,
                            "Domain": domain_name,
                            "Guide": project.project_guide.user.username
                        })
                   
                    domains = list(Domain.objects.values_list('name', flat=True))

                    if not num_panels or not teachers_per_panel:
                        return Response({"error": "Missing required parameters: noOfPanels, noOfTeachers"}, status=400)

                    teacher_names = list(teachers.keys())
                    teacher_vectors = []
                    
                    for teacher in teacher_names:
                        vector = [1 if domain in teachers[teacher] else 0 for domain in domains]
                        teacher_vectors.append(vector)

                    teacher_vectors = np.array(teacher_vectors)
                    
                    scaler = StandardScaler()
                    teacher_vectors_scaled = scaler.fit_transform(teacher_vectors)

                    teacher_vectors_reduced = TSNE(n_components=2, perplexity=1, random_state=42).fit_transform(teacher_vectors_scaled)
                    
                    unassigned_teachers = []
                    
                    def enforce_teacher_limit(panels, max_teachers):
                        
                        assigned_teachers = {teacher for teachers in panels.values() for teacher in teachers}

                        unassigned_teachers = [teacher for teacher in teacher_names if teacher not in assigned_teachers]

                        sorted_panels = sorted(panels.items(), key=lambda x: len(x[1]), reverse=True)

                        underpopulated = [panel_id for panel_id, teachers in sorted_panels if len(teachers) < max_teachers]

                        underpopulated = [panel_id for panel_id, teachers in sorted_panels if len(teachers) < max_teachers]
                        for panel_id, teachers in sorted_panels:
                            while len(teachers) > max_teachers:
                                
                                teacher_to_move = teachers.pop()
                                if underpopulated:
                                    target_panel = underpopulated.pop(0)
                                    panels[target_panel].append(teacher_to_move)
                                    if len(panels[target_panel]) < max_teachers:
                                        underpopulated.append(target_panel)
                                else:
                                    unassigned_teachers.append(teacher_to_move)

                        for teacher in unassigned_teachers:
                            if underpopulated:
                                target_panel = underpopulated.pop(0)
                                panels[target_panel].append(teacher)
                                unassigned_teachers.remove(teacher)
                                if len(panels[target_panel]) < max_teachers:
                                    underpopulated.append(target_panel)
                        return panels,unassigned_teachers

                    hierarchical = AgglomerativeClustering(n_clusters=num_panels, linkage="average")
                    hierarchical_labels = hierarchical.fit_predict(teacher_vectors_reduced)

                    def form_panels(labels, teacher_names):
                        panels = defaultdict(list)
                        for idx, label in enumerate(labels):
                            panels[label].append(teacher_names[idx])
                        return panels

                    hierarchical_panels = form_panels(hierarchical_labels, teacher_names)
                    hierarchical_panels_constrained, unassigned_teachers = enforce_teacher_limit(hierarchical_panels, teachers_per_panel)
                    all_usernames = set(Teacher.objects.filter(user__id__in=all_teacher_ids).values_list("user__username", flat=True))
                    selected_usernames = set(teacher_names)

                    remaining_unassigned = list(all_usernames - selected_usernames)
                    unassigned_teachers.extend(remaining_unassigned)

                    def groups_allocation(panel, groups, teachers):
                        group_panel_assignment = defaultdict(list)
                        unallocated_groups = []  

                        total_groups = len(groups)
                        num_panels = len(panel)
                        groups_per_panel = total_groups // num_panels

                        panel_count = {panel_id: 0 for panel_id in panel}

                        for group in groups:
                            assigned = False
                            for panel_id, panel_teachers in panel.items():

                                if panel_count[panel_id] < groups_per_panel:
                                    
                                    if group["Guide"] in panel_teachers:
                                        
                                        if any(teacher != group["Guide"] and group["Domain"] in teachers[teacher] for teacher in panel_teachers):
                                            group_panel_assignment[panel_id].append(group)
                                            panel_count[panel_id] += 1
                                            assigned = True
                                            break

                            if not assigned:
                                unallocated_groups.append(group)

                        still_unallocated = []
                        for group in unallocated_groups:
                            assigned = False
                            for panel_id, panel_teachers in panel.items():
                                if panel_count[panel_id] < groups_per_panel:  
                                    if any(group["Domain"] in teachers[teacher] for teacher in panel_teachers):
                                        group_panel_assignment[panel_id].append(group)
                                        panel_count[panel_id] += 1
                                        assigned = True
                                        break  

                            if not assigned:
                                still_unallocated.append(group)
                        return group_panel_assignment, still_unallocated

                    hierarchical_groups_allocation, remaining_groups = groups_allocation(hierarchical_panels_constrained, groups, teachers)
   
                    event = AssessmentEvent.objects.create(name=event_name, year=y)

                    if rubrics and isinstance(rubrics, list):
                        for rubric in rubrics:
                            name = rubric.get('name')
                            max_marks = rubric.get('maxMarks')

                            if name and max_marks:
                                try:
                                    max_marks = int(max_marks)
                                except ValueError:
                                    continue  # skip invalid marks

                                AssessmentRubric.objects.create(
                                    event=event,
                                    name=name,
                                    max_marks=max_marks
                                )
                    
                    for index, members in enumerate(hierarchical_panels_constrained.values()):
                        panel_obj = AssessmentPanel.objects.create(event=event, panel_number=index + 1)
                        for username in members:
                            teacher_obj = Teacher.objects.get(user__username=username)
                            panel_obj.teachers.through.objects.create(assessmentpanel=panel_obj, teacher=teacher_obj)

                    for index, groups in enumerate(hierarchical_groups_allocation.values()):
                        panel_obj = AssessmentPanel.objects.get(event=event, panel_number=index + 1)

                        for group in groups:
                            project = Project.objects.get(id = group["Group"])
                            panel_obj.groups.through.objects.create(assessmentpanel=panel_obj, project=project)
        
                    
                    for teacher in unassigned_teachers:
                        teacher_obj = Teacher.objects.get(user__username=teacher)
                        UnassignedTeacher.objects.create(event=event, teacher=teacher_obj)

                
                    for group in remaining_groups:
                        project = Project.objects.get(id = group['Group'])
                        UnassignedGroup.objects.create(event=event, group=project)
                else:
                    def randomly_assign_teachers_to_panels(teacher_usernames, num_panels, teachers_per_panel):
                        print("entered")
                        required_teacher_count = num_panels * teachers_per_panel
                        random.shuffle(teacher_usernames)

                        assigned_teachers = teacher_usernames[:required_teacher_count]
                        unassigned_teachers = teacher_usernames[required_teacher_count:]

                        panels = defaultdict(list)
                        panel_index = 0

                        for username in assigned_teachers:
                            panels[panel_index].append(username)
                            panel_index = (panel_index + 1) % num_panels

                        return panels, unassigned_teachers
                    def assign_groups_to_panels_with_guide_preference(projects, panels):
                        print("entered 2")
                        panel_ids = list(panels.keys())
                        group_assignments = defaultdict(list)
                        panel_group_counts = defaultdict(int)

                        for project in projects:
                            print("for loop 2")
                            guide_username = project.project_guide.user.username if project.project_guide else None
                            
                            # Try to find a panel where guide exists
                            target_panel = None
                            for pid, teachers in panels.items():
                                print("for loop 3")
                                if guide_username in teachers:
                                    target_panel = pid
                                    break
                            
                            # If guide not in any panel, assign to panel with least groups
                            if target_panel is None:
                                target_panel = min(panel_ids, key=lambda pid: panel_group_counts[pid])
                            
                            group_assignments[target_panel].append(project)
                            panel_group_counts[target_panel] += 1

                        return group_assignments

                    selected_usernames = list(User.objects.filter(id__in=selected_teacher_ids).values_list("username", flat=True))
                    teacher_usernames = list(selected_usernames)
                    print(teacher_usernames)
                    # panels = randomly_assign_teachers_to_panels(teacher_usernames, num_panels, teachers_per_panel)
                    panels, extra_unassigned_teachers = randomly_assign_teachers_to_panels(
                        teacher_usernames, num_panels, teachers_per_panel
                    )
                    group_assignments = assign_groups_to_panels_with_guide_preference(projects, panels)
                    print(panels)
                    print(group_assignments)
                    event = AssessmentEvent.objects.create(name=event_name, year=y)

                    if rubrics and isinstance(rubrics, list):
                        for rubric in rubrics:
                            name = rubric.get('name')
                            max_marks = rubric.get('maxMarks')

                            if name and max_marks:
                                try:
                                    max_marks = int(max_marks)
                                except ValueError:
                                    continue  # skip invalid marks

                                AssessmentRubric.objects.create(
                                    event=event,
                                    name=name,
                                    max_marks=max_marks
                                )
                    for index, members in panels.items():
                        panel_obj = AssessmentPanel.objects.create(event=event, panel_number=index + 1)
                        for username in members:
                            teacher_obj = Teacher.objects.get(user__username=username)
                            panel_obj.teachers.through.objects.create(assessmentpanel=panel_obj, teacher=teacher_obj)

                    for index, group_list in group_assignments.items():
                        panel_obj = AssessmentPanel.objects.get(event=event, panel_number=index + 1)
                        for project in group_list:
                            panel_obj.groups.through.objects.create(assessmentpanel=panel_obj, project=project)

                    # Unassigned teachers (optional)
                    assigned_teachers = set(t for plist in panels.values() for t in plist)
                    all_usernames = set(Teacher.objects.filter(user__id__in=all_teacher_ids).values_list("user__username", flat=True))
                    unassigned_teachers = list(all_usernames - assigned_teachers)
                    for uname in unassigned_teachers:
                        teacher_obj = Teacher.objects.get(user__username=uname)
                        UnassignedTeacher.objects.create(event=event, teacher=teacher_obj)

                
                    return Response({"event_id": event.id}, status=200)
            return Response(status=200)
        except Exception as e:
            print("Error during clustering and allocation:", e)
            return Response({"error": str(e)}, status=400)


class GuideAllocationViewSet(viewsets.ViewSet):

    @action(detail=False, methods=['get'])
    @transaction.atomic
    def allocate_guides(self, request):
        category = request.query_params.get('category', None)
        year = request.query_params.get('year', None)
        sem = request.query_params.get('sem', None)
        div = request.query_params.get('div', None)

        sem = None if (not sem or sem.lower() == "null") else sem.strip()
        div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

        dept = Department.objects.filter(name__iexact=category).first()
        if not dept:
            return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

        y = Year.objects.filter(department=dept, year=year).first()
        if not y:
            return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

        if div is not None:
            semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
        else:
            semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()

        if not semester:
            return Response(
                {"error": f"Semester '{sem}' with Division '{div}' not found for year '{year}'"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if sem == "Major Project":
            domains = [d.name for d in Domain.objects.all()]
            teachers = [t.teacher.user.username for t in ProjectGuide.objects.filter(sem=semester)]
            
            div_count = {}
            index = 1
            for project in Project.objects.filter(sem=semester):
                if project.div not in div_count:
                    div_count[project.div] = 1  # Start numbering from 1
                else:
                    div_count[project.div] += 1
                
                project.group_no = f"{project.div}{div_count[project.div]}"
                project.save()

            
            groups = []
            
            for project in Project.objects.filter(sem=semester):
                
                domain_pref = DomainPreference.objects.filter(project = project)

                teacher_prefs = {}

                domain_prefs = [0]*len(domains)
                for domain in domain_pref:
                    domain_index = domains.index(domain.domain.name)
                    domain_prefs[domain_index] = domain.rank

                
                for domain in domain_pref:
                    guide_pref = [0]*len(teachers)
                    for pref in GuidePreference.objects.filter(preference = domain):
                        teacher_index = teachers.index(pref.teacher.user.username)
                        guide_pref[teacher_index] = pref.rank
                    teacher_prefs[domains.index(domain.domain.name)] = guide_pref

                group_instance = Group(id=project.id, domain_prefs=domain_prefs, teacher_prefs=teacher_prefs)
                groups.append(group_instance)
            
            teacher_data = []
            for teacher in teachers:
                domain_prefs = [0]*len(domains)
                for pref in TeacherPreference.objects.filter(teacher__user__username=teacher):
                    domain_index = domains.index(pref.domain.name)
                    domain_prefs[domain_index] = pref.preference_rank
                guide_entry = ProjectGuide.objects.filter(sem=semester, teacher__user__username=teacher).first()
                max_groups = guide_entry.max_groups if guide_entry else 0
                teachers_data = Teachers(
                    username=teacher,
                    domain_prefs=domain_prefs,
                    max_groups=max_groups 
                )
                teacher_data.append(teachers_data)
            valid_values = []
            for teacher in teacher_data:
                for domain_index, rank in enumerate(teacher.domain_prefs):
                    if rank > 0:  
                        teacher_index = teachers.index(teacher.username)
                        valid_values.append((domain_index, teacher_index))
            best_solution = run_evolution(
                populate_func=partial(generate_population, size=300, groups=groups, teachers=teacher_data),
                fitness_func=partial(fitness, groups=groups, teachers=teacher_data),
                groups = groups,
                valid_values=valid_values,
                teachers = teacher_data,
                generation_limit=100,  
            )

        

            automatic_allocations = []
            manual_allocations = []
            domain_matched_allocations = []

            try:
                with transaction.atomic():
                    for i, (domain_idx, teacher_idx) in enumerate(best_solution):
                        group = groups[i]
                        assigned_domain = domains[domain_idx]
                        assigned_teacher = teachers[teacher_idx]

                        teacher_obj = next((t for t in teacher_data if t.username == assigned_teacher), None)
                        teacher_pref_domains = [
                            domains[idx] for idx, rank in enumerate(teacher_obj.domain_prefs) if rank > 0
                        ] if teacher_obj else []

                        project = Project.objects.get(id=group.id,sem=semester)
                        student_preferences = DomainPreference.objects.filter(project=project).order_by('rank')
                        pref = {}
                        for dp in student_preferences:
                            guide_preferences = GuidePreference.objects.filter(preference=dp).order_by("rank")

                            if dp.domain.name not in pref:
                                pref[dp.domain.name] = []

                            pref[dp.domain.name].extend(gp.teacher.user.username for gp in guide_preferences)

                        project_guide_obj = ProjectGuide.objects.filter(sem=semester, teacher__user__username=assigned_teacher).first()

                        if not project_guide_obj or project_guide_obj.availability <= 0:
                            manual_allocations.append({
                                "group_id": project.id,
                                "domain": assigned_domain,
                                "teacher": assigned_teacher,
                                "reason": "Teacher not available"
                            })
                            Project.objects.update_or_create(
                                id=group.id,
                                sem=semester,
                                defaults={
                                    "project_guide": Teacher.objects.get(user__username=assigned_teacher),
                                    "domain": Domain.objects.get(name=assigned_domain),
                                    "final": 1
                                }
                            )
                            continue 

                        if assigned_domain in pref and assigned_teacher in pref[assigned_domain]:
                            automatic_allocations.append({
                                "group_id": project.id,
                                "domain": assigned_domain,
                                "teacher": assigned_teacher
                            })
                        elif assigned_domain in teacher_pref_domains and assigned_domain in pref:
                            domain_matched_allocations.append({
                                "group_id": project.id,
                                "domain": assigned_domain,
                                "teacher": assigned_teacher
                            })
                        else:
                            manual_allocations.append({
                                "group_id": project.id,
                                "domain": assigned_domain,
                                "teacher": assigned_teacher,
                                "reason": "Preference mismatch"
                            })
                            Project.objects.update_or_create(
                                id=group.id,
                                sem=semester,
                                defaults={
                                    "project_guide": Teacher.objects.get(user__username=assigned_teacher),
                                    "domain": Domain.objects.get(name=assigned_domain),
                                    "final": 1
                                }
                            )
                            continue  

                        Project.objects.update_or_create(
                            id=group.id,
                            sem=semester,
                            defaults={
                                "project_guide": Teacher.objects.get(user__username=assigned_teacher),
                                "domain": Domain.objects.get(name=assigned_domain)
                            }
                        )

                        project_guide_obj.availability -= 1
                        project_guide_obj.save()
                        # if assigned_domain in pref and assigned_teacher in pref[assigned_domain]:
                        #     automatic_allocations.append({
                        #         "group_id": project.id,
                        #         "domain": assigned_domain,
                        #         "teacher": assigned_teacher
                        #     })
                        
                        #     Project.objects.update_or_create(
                        #         id=group.id, 
                        #         sem=semester,
                        #         defaults={
                        #             "project_guide": Teacher.objects.get(user__username=assigned_teacher),
                        #             "domain": Domain.objects.get(name=assigned_domain)
                        #         }
                        #     )
                        # elif assigned_domain in teacher_pref_domains and assigned_domain in pref:
                        #     automatic_allocations.append({
                        #         "group_id": project.id,
                        #         "domain": assigned_domain,
                        #         "teacher": assigned_teacher
                        #     })
                            
                        #     Project.objects.update_or_create(
                        #         id=group.id, 
                        #         sem=semester,
                        #         defaults={
                        #             "project_guide": Teacher.objects.get(user__username=assigned_teacher),
                        #             "domain": Domain.objects.get(name=assigned_domain)
                        #         }
                        #     )
                        # else:
                        #     manual_allocations.append({
                        #         "group_id": project.id,
                        #         "domain": assigned_domain,
                        #         "teacher": assigned_teacher
                        #     })
                        #     Project.objects.update_or_create(
                        #         id=group.id, 
                        #         sem=semester,
                        #         defaults={
                        #             "project_guide": Teacher.objects.get(user__username=assigned_teacher),
                        #             "domain": Domain.objects.get(name=assigned_domain),
                        #             "final":1
                        #         }
                        #     )
                summary = {
                    "automatic_count": len(automatic_allocations),
                    "domain_matched_count": len(domain_matched_allocations),
                    "manual_count": len(manual_allocations),
                    "total_groups": len(groups),
                    "message": (
                        f"{len(automatic_allocations)} groups perfectly allocated, "
                        f"{len(domain_matched_allocations)} groups allocated based on domain match, "
                        f"{len(manual_allocations)} groups need manual allocation."
                    )
                }

                return Response({
                    "automatic_allocations": automatic_allocations,
                    "domain_matched_allocations": domain_matched_allocations,
                    "manual_allocations": manual_allocations,
                    "summary": summary
                })
            except Exception as e:
                return Response({"error": f"Transaction failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            print("entered")
            teachers = [t.teacher.user.username for t in ProjectGuide.objects.filter(sem=semester)]
            
            div_count = {}
            index = 1
            for project in Project.objects.filter(sem=semester):
                if project.div not in div_count:
                    div_count[project.div] = 1  # Start numbering from 1
                else:
                    div_count[project.div] += 1
                
                project.group_no = f"{project.div}{div_count[project.div]}"
                project.save()

            groups = []
            for project in Project.objects.filter(sem=semester):
                teacher_prefs = [0]*len(teachers)
                for pref in MiniProjectGuidePreference.objects.filter(project = project):
                    teacher_index = teachers.index(pref.teacher.user.username)
                    teacher_prefs[teacher_index] = pref.rank
                group_instance = Projects(id=project.id, teacher_prefs=teacher_prefs)
                groups.append(group_instance)
            
            teacher_data = []
            for teacher in teachers:
                guide_entry = ProjectGuide.objects.filter(sem=semester, teacher__user__username=teacher).first()
                max_groups = guide_entry.max_groups if guide_entry else 0
                teachers_data = Guide(
                    username=teacher,
                    max_groups=max_groups 
                )
                teacher_data.append(teachers_data)

            best_solution, generations = evolution(
                populate_func=partial(population, size=300, groups=groups, teachers=teacher_data),
                fitness_func=partial(fitness_func, groups=groups, teachers=teacher_data),
                groups = groups,
                teachers = teacher_data,
                generation_limit=100,  
            )
            best= best_solution[0]

            automatic_allocations = []
            manual_allocations = []

            try:
                with transaction.atomic():
                    for i, teacher_idx in enumerate(best):
                        group = groups[i]  # Your Projects instance
                        assigned_teacher_username = teachers[teacher_idx]  # Username from teachers list
                        project = Project.objects.get(id=group.id, sem=semester)

                        teacher_obj = ProjectGuide.objects.filter(sem=semester, teacher__user__username=assigned_teacher_username).first()

                        if teacher_obj:
                            # Checking if the assigned teacher was in the student's preferences
                            student_teacher_prefs = MiniProjectGuidePreference.objects.filter(project=project).order_by('rank')
                            student_pref_usernames = [pref.teacher.user.username for pref in student_teacher_prefs]

                            if assigned_teacher_username in student_pref_usernames and teacher_obj.availability>0:
                                # automatic allocation
                                automatic_allocations.append({
                                    "group_id": project.id,
                                    "assigned_teacher": assigned_teacher_username,
                                    "group_no": project.group_no
                                })
                                
                                project.project_guide = teacher_obj.teacher
                                project.save()
                                teacher_obj.availability = teacher_obj.availability-1
                                teacher_obj.save()

                            else:
                                # manual allocation
                                manual_allocations.append({
                                    "group_id": project.id,
                                    "assigned_teacher": assigned_teacher_username,
                                    "group_no": project.group_no
                                })
                                
                                project.project_guide = teacher_obj.teacher
                                project.final = 1  # Marked for manual
                                project.save()

                    summary = {
                        "automatic_count": len(automatic_allocations),
                        "manual_count": len(manual_allocations),
                        "total_groups": len(groups),
                        "message": (
                            f"{len(automatic_allocations)} groups perfectly allocated, "
                            f"{len(manual_allocations)} groups need manual allocation."
                        )
                    }

                    return Response({
                        "automatic_allocations": automatic_allocations,
                        "manual_allocations": manual_allocations,
                        "summary": summary
                    })
            except Exception as e:
                return Response({"error": f"Transaction failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

       

class CustomModelViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    
    @action(detail=False, methods=['get'], url_path='generate-pdf')
    def generate_pdf(self, request):
        try:
            category = request.query_params.get('category', None)
            year = request.query_params.get('year', None)
            sem = request.query_params.get('sem', None)
            div = request.query_params.get('div', None)

            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()
            
            projects = Project.objects.filter(sem=semester).order_by("div","id")

            project_data = {}
    
            
            div_count = {}
            
            for project in projects:
                if project.div not in div_count:
                    div_count[project.div] = 1  
                else:
                    div_count[project.div] += 1
                
                moodle_ids = []
                student_names = []

                def get_full_name(student):
                    name_parts = [student.user.first_name]
                    if student.middle_name:  
                        name_parts.append(student.middle_name)
                    name_parts.append(student.user.last_name)
                    return " ".join(name_parts)

                if project.leader:
                    moodle_ids.append(project.leader.user.username)
                    student_names.append(get_full_name(project.leader))

                if project.members.exists():
                    moodle_ids.extend([member.user.username for member in project.members.all()])
                    student_names.extend([get_full_name(member) for member in project.members.all()])
                
                teacher = []
                teacher.append(get_full_name(project.project_guide) if project.project_guide else None)
                teacher.append(get_full_name(project.project_co_guide) if project.project_co_guide else None)
                project_data[project.group_no] = {
                    "moodleIDs": moodle_ids,
                    "students": student_names,
                    "domain": project.domain.name if project.domain else None,
                    "teacher": teacher,
                }
            print(project_data)


            def header(canvas, doc, year, dept):
                try:
                    image_path = os.path.join(settings.BASE_DIR, 'images', 'image.png')  
                    canvas.drawImage(image_path, 30, 750, width=530, height=80)
                    canvas.setFont("Helvetica", 10)
                    canvas.drawString(40, 725, f"Class/Division: BE {dept}")
                    canvas.drawString(280, 725, "Sem: VII")
                    canvas.drawString(450, 725, f"Academic Year: {year}")
                    canvas.line(30, 710, 570, 710)
                except Exception as e:
                    print(f"Error in header function: {e}")
            
            sform = dept.shortform
            def header_with_year(canvas, doc):
                header(canvas, doc, year, sform)

            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = 'inline; filename="guide_allocation.pdf"'

            doc = SimpleDocTemplate(response, pagesize=A4)
            frame = Frame(30, 50, 530, 630, id='normal')  
            template = PageTemplate(id='header_template', frames=frame, onPage=header_with_year)
            doc.addPageTemplates([template])

            elements = []
            styles = getSampleStyleSheet()
            title_style = styles["Title"]

            elements.append(Paragraph("Guide Allocation Report", title_style))
            elements.append(Spacer(1, 12))

            
            data = [["Sr. No.", "Group Number", "Moodle ID", "Name of the Student", "Domain", "Project Guide"]]

            
            for index, (group, details) in enumerate(project_data.items(), start=1):
            
                domain = re.sub(r"\s*[,&]\s*", "\n", details.get("domain", "N/A"))
                guide = "\n".join(filter(None, details.get("teacher", [])))

                moodle_ids = "\n".join(details.get("moodleIDs", []))
                student_names = "\n".join(details.get("students", []))

                data.append([str(index), group, moodle_ids, student_names, domain, guide])

            table = Table(data, colWidths=[50, 80, 60, 155, 115, 120])
            table.setStyle(TableStyle([
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))

            elements.append(table)
            elements.append(Spacer(1, 50))

            footer = []
            
            footer = [
                ["Mr. Sachin Kasare", "Mr. Vishal Badgujar", "Ms. Sonal Balpande", "Dr. Kiran Deshpande"],
                ["(Project Co-Coordinator)", "(Project Co-ordinator)", "(Class In-charge)", "(HOD, Information Technology)"],
            ]

            footer_table = Table(footer, colWidths=[150, 150, 150, 150])
            footer_table.setStyle(TableStyle([
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ]))

            elements.append(footer_table)
            doc.build(elements)

            return response
        except Exception as e:
            import traceback
            error_message = traceback.format_exc()
            print("Error Generating PDF:", error_message)  # Debugging
            return Response({"error": str(e)}, status=500)

    
    @action(detail=False, methods=['get'], url_path='generate-excel-v2')
    def generate_excel(self, request):
        try:
            category = request.query_params.get('category', None)
            year = request.query_params.get('year', None)
            sem = request.query_params.get('sem', None)
            div = request.query_params.get('div', None)

            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()
            
            projects = Project.objects.filter(sem=semester).order_by("div","id")
            print(projects)

            project_data = []

            div_count = {}
            index = 1
            for project in projects:
                if project.div not in div_count:
                    div_count[project.div] = 1 
                else:
                    div_count[project.div] += 1
                
                group_code = f"{project.div}{div_count[project.div]}"
                
                moodle_ids = []
                student_names = []

                def get_full_name(student):
                    name_parts = [student.user.first_name]
                    if student.middle_name:  
                        name_parts.append(student.middle_name)
                    name_parts.append(student.user.last_name)
                    return " ".join(name_parts)

                if project.leader:
                    moodle_ids.append(project.leader.user.username)
                    student_names.append(get_full_name(project.leader))

                if project.members.exists():
                    moodle_ids.extend([member.user.username for member in project.members.all()])
                    student_names.extend([get_full_name(member) for member in project.members.all()])
                
                teacher = []
                if project.project_guide:
                    teacher.append(get_full_name(project.project_guide))
                if project.project_co_guide:
                    teacher.append(get_full_name(project.project_co_guide))

                project_data.append([index,project.group_no,moodle_ids,student_names,"\n".join(teacher)])

                index+=1
            print(project_data)

            
            output = BytesIO()

            workbook = xlsxwriter.Workbook(output, {'in_memory': True})
            worksheet = workbook.add_worksheet('Guide Allocation Report')

            title_format = workbook.add_format({
                'bold': True,
                'font_size': 14,
                'align': 'center',
                'valign': 'vcenter'
            })

            subtitle_format = workbook.add_format({
                'bold': True,
                'font_size': 12,
                'align': 'center',
                'valign': 'vcenter'
            })

            header_format = workbook.add_format({
                'bold': True,
                # 'bg_color': '#D3D3D3',
                'border': 1,
                'align': 'center',
                'valign': 'vcenter'
            })

            cell_format = workbook.add_format({
                'border': 1,
                'align': 'left',
                'valign': 'vcenter'
            })

            merged_cell_format = workbook.add_format({
                'border': 1,
                'align': 'center',
                'valign': 'vcenter'
            })

            merged_guide_format = workbook.add_format({
                'border': 1,
                'align': 'center',
                'valign': 'vcenter',
                'text_wrap': True  
            })

            image_path = os.path.join(settings.BASE_DIR, 'images', 'image.png')
            worksheet.insert_image('B1', image_path, {'x_scale': 1, 'y_scale': 1, 'url': '', 'align': 'center'})
            worksheet.set_row(1,40)
            
            worksheet.merge_range('A6:F6', "Guide Allocation", title_format)
            worksheet.merge_range('A7:F7', "Academic Year: 2024-25", subtitle_format)

            
            worksheet.set_column('A:A', 6)  
            worksheet.set_column('B:B', 15) 
            worksheet.set_column('C:C', 30)  
            worksheet.set_column('D:D', 40) 
            worksheet.set_column('E:E', 40) 

            headers = ["Sr. No.", "Group Number", "Moodle ID", "Name of the Student", "Project Guide & Co-Guide"]
            for col_num, header in enumerate(headers):
                worksheet.write(8, col_num, header, header_format)  
           
            row = 9  
            for sr_no, group, moodle_ids, students, guide in project_data:
                group_size = len(students)  
                
                if group_size > 1:
                    worksheet.merge_range(row, 0, row + group_size - 1, 0, sr_no, merged_cell_format)  
                    worksheet.merge_range(row, 1, row + group_size - 1, 1, group, merged_cell_format)  
                    worksheet.merge_range(row, 4, row + group_size - 1, 4, guide, merged_guide_format)  

                for i in range(group_size):  
                    worksheet.write(row, 2, moodle_ids[i], cell_format)  
                    worksheet.write(row, 3, students[i], cell_format)  
                    row += 1  

            footer_row = row + 10  

            footer_format = workbook.add_format({
                'bold': True,
                'align': 'justify',  
                'valign': 'vcenter',
                'text_wrap': True 
            })


            worksheet.set_column('A:D', 25)

            worksheet.write(footer_row, 0, "Mr. Sachin Kasare\n(Project Co-Coordinator)", footer_format)
            worksheet.write(footer_row, 1, "Mr. Vishal Badgujar\n(Project Co-ordinator)", footer_format)
            worksheet.write(footer_row, 2, "Ms. Sonal Balpande\n(Class In-charge)", footer_format)
            worksheet.write(footer_row, 3, "Dr. Kiran Deshpande\n(HOD, Information Technology)", footer_format)

            workbook.close()

            output.seek(0)
            response = HttpResponse(
                output,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename="guide_allocation.xlsx"'
            return response

        except Exception as e:
            return HttpResponse(f"Error generating Excel: {e}", status=500)
        
    @action(detail=False, methods=['get'])
    def guide_allocation_excel(self, request):
        try:
            category = request.query_params.get('category', None)
            year = request.query_params.get('year', None)
            sem = request.query_params.get('sem', None)
            div = request.query_params.get('div', None)

            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()
            
            if semester:
                project_coordinator = semester.project_coordinator
                project_co_coordinator = semester.project_co_coordinator
                class_incharge = semester.class_incharge
            
            hod = Teacher.objects.filter(department=dept, role__name="Head of Department").first()
            footer_data = [
                (project_coordinator, "Project Co-Coordinator"),
                (project_co_coordinator, "Project Co-ordinator"),
                (class_incharge, "Class In-charge"),
                (hod, "HOD")
            ]
            projects = Project.objects.filter(sem=semester).order_by("div","id")
            print(projects)

            project_data = []

            div_count = {}
            index = 1
            for project in projects:
                if project.div not in div_count:
                    div_count[project.div] = 1 
                else:
                    div_count[project.div] += 1
                
                group_code = f"{project.div}{div_count[project.div]}"
                
                moodle_ids = []
                student_names = []

                def get_full_name(student):
                    name_parts = [student.user.first_name]
                    if student.middle_name:  
                        name_parts.append(student.middle_name)
                    name_parts.append(student.user.last_name)
                    return " ".join(name_parts)

                if project.leader:
                    moodle_ids.append(project.leader.user.username)
                    student_names.append(get_full_name(project.leader))

                if project.members.exists():
                    moodle_ids.extend([member.user.username for member in project.members.all()])
                    student_names.extend([get_full_name(member) for member in project.members.all()])
                
                teacher = []
                if project.project_guide:
                    teacher.append(get_full_name(project.project_guide))
                if project.project_co_guide:
                    teacher.append(get_full_name(project.project_co_guide))

                project_data.append([index,project.group_no,moodle_ids,student_names,"\n".join(teacher)])

                index+=1
            print(project_data)

            
            output = BytesIO()

            workbook = xlsxwriter.Workbook(output, {'in_memory': True})
            worksheet = workbook.add_worksheet('Guide Allocation Report')

            title_format = workbook.add_format({
                'bold': True,
                'font_size': 14,
                'align': 'center',
                'valign': 'vcenter'
            })

            subtitle_format = workbook.add_format({
                'bold': True,
                'font_size': 12,
                'align': 'center',
                'valign': 'vcenter'
            })

            header_format = workbook.add_format({
                'bold': True,
                # 'bg_color': '#D3D3D3',
                'border': 1,
                'align': 'center',
                'valign': 'vcenter'
            })

            cell_format = workbook.add_format({
                'border': 1,
                'align': 'left',
                'valign': 'vcenter'
            })

            merged_cell_format = workbook.add_format({
                'border': 1,
                'align': 'center',
                'valign': 'vcenter'
            })

            merged_guide_format = workbook.add_format({
                'border': 1,
                'align': 'center',
                'valign': 'vcenter',
                'text_wrap': True  
            })

            image_path = os.path.join(settings.BASE_DIR, 'images', 'image.png')
            worksheet.insert_image('B1', image_path, {'x_scale': 1, 'y_scale': 1, 'url': '', 'align': 'center'})
            worksheet.set_row(1,40)
            
            worksheet.merge_range('A6:F6', "Guide Allocation", title_format)
            worksheet.merge_range('A7:F7', "Academic Year: 2024-25", subtitle_format)

            
            worksheet.set_column('A:A', 6)  
            worksheet.set_column('B:B', 15) 
            worksheet.set_column('C:C', 30)  
            worksheet.set_column('D:D', 40) 
            worksheet.set_column('E:E', 40) 

            headers = ["Sr. No.", "Group Number", "Moodle ID", "Name of the Student", "Project Guide & Co-Guide"]
            for col_num, header in enumerate(headers):
                worksheet.write(8, col_num, header, header_format)  
           
            row = 9  
            for sr_no, group, moodle_ids, students, guide in project_data:
                group_size = len(students)  
                
                if group_size > 1:
                    worksheet.merge_range(row, 0, row + group_size - 1, 0, sr_no, merged_cell_format)  
                    worksheet.merge_range(row, 1, row + group_size - 1, 1, group, merged_cell_format)  
                    worksheet.merge_range(row, 4, row + group_size - 1, 4, guide, merged_guide_format)  

                for i in range(group_size):  
                    worksheet.write(row, 2, moodle_ids[i], cell_format)  
                    worksheet.write(row, 3, students[i], cell_format)  
                    row += 1  

            footer_row = row + 10  

            footer_format = workbook.add_format({
                'bold': True,
                'align': 'justify',  
                'valign': 'vcenter',
                'text_wrap': True 
            })


            worksheet.set_column('A:D', 25)

            # worksheet.write(footer_row, 0, "Mr. Sachin Kasare\n(Project Co-Coordinator)", footer_format)
            # worksheet.write(footer_row, 1, "Mr. Vishal Badgujar\n(Project Co-ordinator)", footer_format)
            # worksheet.write(footer_row, 2, "Ms. Sonal Balpande\n(Class In-charge)", footer_format)
            # worksheet.write(footer_row, 3, "Dr. Kiran Deshpande\n(HOD, Information Technology)", footer_format)

            for idx, (teacher, role) in enumerate(footer_data):
                if teacher:
                    full_name = f"{teacher.user.first_name} {teacher.middle_name if teacher.middle_name else ''} {teacher.user.last_name}".strip()
                    worksheet.write(footer_row, idx, f"{full_name}\n({role})", footer_format)

           
            for idx, (teacher, role) in enumerate(footer_data):
                if not teacher:
                    worksheet.write(footer_row, idx, f"Not Available\n({role})", footer_format)

            workbook.close()

            output.seek(0)
            response = HttpResponse(
                output,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename="guide_allocation.xlsx"'
            return response

        except Exception as e:
            return HttpResponse(f"Error generating Excel: {e}", status=500)
    
    @action(detail=False, methods=['get'], url_path='week-progress')
    def week_progress_excel(self, request):
        try:
            category = request.query_params.get('category', None)
            year = request.query_params.get('year', None)
            sem = request.query_params.get('sem', None)
            div = request.query_params.get('div', None)
            weekno = request.query_params.get('week_number', None)

            if not weekno or not weekno.isdigit():
                return Response({"error": "Invalid or missing week number"}, status=status.HTTP_400_BAD_REQUEST)

            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()
            
            if semester:
                project_coordinator = semester.project_coordinator
                project_co_coordinator = semester.project_co_coordinator
                class_incharge = semester.class_incharge
            
            sem_value = None
            if sem == "Major Project":  # or whatever the correct condition is
                sem_value = request.query_params.get('sem_new', None)

            hod = Teacher.objects.filter(department=dept, role__name="Head of Department").first()
            footer_data = [
                (project_coordinator, "Project Co-Coordinator"),
                (project_co_coordinator, "Project Co-ordinator"),
                (class_incharge, "Class In-charge"),
                (hod, "HOD")
            ]
            # projects = Project.objects.filter(sem=semester).order_by("div","id")
            # print(projects)
            print(sem_value)
            print("Requested Week:", weekno)
            print("Semester:", semester)
            matching_week = Week.objects.filter(semester=semester, week_number=int(weekno)).first()
            print("Matching Week:", matching_week)
            completed_projects_ids = ProjectWeekProgress.objects.filter(
                week__semester=semester,
                week__sem = sem_value,
                week__week_number=int(weekno),
                is_final=True
            ).values_list('project_id', flat=True)
            print(completed_projects_ids)

            projects = Project.objects.filter(
                id__in=completed_projects_ids
            ).order_by("div", "id")

            print(projects)
            project_data = []

            div_count = {}
            index = 1
            for project in projects:
                if project.div not in div_count:
                    div_count[project.div] = 1 
                else:
                    div_count[project.div] += 1
                
                group_code = f"{project.div}{div_count[project.div]}"
                
                moodle_ids = []
                student_names = []

                def get_full_name(student):
                    name_parts = [student.user.first_name]
                    if student.middle_name:  
                        name_parts.append(student.middle_name)
                    name_parts.append(student.user.last_name)
                    return " ".join(name_parts)

                if project.leader:
                    moodle_ids.append(project.leader.user.username)
                    student_names.append(get_full_name(project.leader))

                if project.members.exists():
                    moodle_ids.extend([member.user.username for member in project.members.all()])
                    student_names.extend([get_full_name(member) for member in project.members.all()])
                
                teacher = []
                if project.project_guide:
                    teacher.append(get_full_name(project.project_guide))
                if project.project_co_guide:
                    teacher.append(get_full_name(project.project_co_guide))

                project_data.append([index,project.group_no,moodle_ids,student_names,"\n".join(teacher)])

                index+=1
            print(project_data)

            
            output = BytesIO()

            workbook = xlsxwriter.Workbook(output, {'in_memory': True})
            worksheet = workbook.add_worksheet('Weekly Logbook Report')

            title_format = workbook.add_format({
                'bold': True,
                'font_size': 14,
                'align': 'center',
                'valign': 'vcenter'
            })

            subtitle_format = workbook.add_format({
                'bold': True,
                'font_size': 12,
                'align': 'center',
                'valign': 'vcenter'
            })

            header_format = workbook.add_format({
                'bold': True,
                # 'bg_color': '#D3D3D3',
                'border': 1,
                'align': 'center',
                'valign': 'vcenter'
            })

            cell_format = workbook.add_format({
                'border': 1,
                'align': 'left',
                'valign': 'vcenter'
            })

            merged_cell_format = workbook.add_format({
                'border': 1,
                'align': 'center',
                'valign': 'vcenter'
            })

            merged_guide_format = workbook.add_format({
                'border': 1,
                'align': 'center',
                'valign': 'vcenter',
                'text_wrap': True  
            })

            image_path = os.path.join(settings.BASE_DIR, 'images', 'image.png')
            worksheet.insert_image('B1', image_path, {'x_scale': 1, 'y_scale': 1, 'url': '', 'align': 'center'})
            worksheet.set_row(1,40)
            
            worksheet.merge_range('A6:F6', "Guide Allocation", title_format)
            worksheet.merge_range('A7:F7', "Academic Year: 2024-25", subtitle_format)

            
            worksheet.set_column('A:A', 6)  
            worksheet.set_column('B:B', 15) 
            worksheet.set_column('C:C', 30)  
            worksheet.set_column('D:D', 40) 
            worksheet.set_column('E:E', 40) 

            headers = ["Sr. No.", "Group Number", "Moodle ID", "Name of the Student", "Project Guide & Co-Guide"]
            for col_num, header in enumerate(headers):
                worksheet.write(8, col_num, header, header_format)  
           
            row = 9  
            for sr_no, group, moodle_ids, students, guide in project_data:
                group_size = len(students)  
                
                if group_size > 1:
                    worksheet.merge_range(row, 0, row + group_size - 1, 0, sr_no, merged_cell_format)  
                    worksheet.merge_range(row, 1, row + group_size - 1, 1, group, merged_cell_format)  
                    worksheet.merge_range(row, 4, row + group_size - 1, 4, guide, merged_guide_format)  

                for i in range(group_size):  
                    worksheet.write(row, 2, moodle_ids[i], cell_format)  
                    worksheet.write(row, 3, students[i], cell_format)  
                    row += 1  

            footer_row = row + 10  

            footer_format = workbook.add_format({
                'bold': True,
                'align': 'justify',  
                'valign': 'vcenter',
                'text_wrap': True 
            })


            worksheet.set_column('A:D', 25)

            # worksheet.write(footer_row, 0, "Mr. Sachin Kasare\n(Project Co-Coordinator)", footer_format)
            # worksheet.write(footer_row, 1, "Mr. Vishal Badgujar\n(Project Co-ordinator)", footer_format)
            # worksheet.write(footer_row, 2, "Ms. Sonal Balpande\n(Class In-charge)", footer_format)
            # worksheet.write(footer_row, 3, "Dr. Kiran Deshpande\n(HOD, Information Technology)", footer_format)

            for idx, (teacher, role) in enumerate(footer_data):
                if teacher:
                    full_name = f"{teacher.user.first_name} {teacher.middle_name if teacher.middle_name else ''} {teacher.user.last_name}".strip()
                    worksheet.write(footer_row, idx, f"{full_name}\n({role})", footer_format)

           
            for idx, (teacher, role) in enumerate(footer_data):
                if not teacher:
                    worksheet.write(footer_row, idx, f"Not Available\n({role})", footer_format)

            workbook.close()

            output.seek(0)
            response = HttpResponse(
                output,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename="guide_allocation.xlsx"'
            return response

        except Exception as e:
            return HttpResponse(f"Error generating Excel: {e}", status=500)


    @action(detail=False, methods=['get'], url_path='panel-excel')
    def panel_excel(self, request):
        def get_full_name(student):
            name_parts = [student.user.first_name]
            if student.middle_name:  
                name_parts.append(student.middle_name)
            name_parts.append(student.user.last_name)
            return " ".join(name_parts)
        try:

            event_id = request.query_params.get("id", None)
            event = AssessmentEvent.objects.get(pk=event_id)
            panels = AssessmentPanel.objects.filter(event=event)

            output = BytesIO()
            workbook = xlsxwriter.Workbook(output, {'in_memory': True})
            worksheet = workbook.add_worksheet('Panel Formation Report')

            title_format = workbook.add_format({'bold': True, 'font_size': 14, 'align': 'center', 'valign': 'vcenter'})
            subtitle_format = workbook.add_format({'bold': True, 'font_size': 12, 'align': 'center', 'valign': 'vcenter'})
            header_format = workbook.add_format({'bold': True, 'border': 1, 'align': 'center', 'valign': 'vcenter'})
            cell_format = workbook.add_format({'border': 1, 'align': 'left', 'valign': 'vcenter'})
            merged_format = workbook.add_format({'border': 1, 'align': 'center', 'valign': 'vcenter', 'text_wrap': True})

            
            logo_path = os.path.join(settings.BASE_DIR, 'images', 'image.png')
            worksheet.insert_image('B1', logo_path, {'x_scale': 1, 'y_scale': 1})
            worksheet.set_row(1, 40)

        
            worksheet.merge_range('A6:G6', "Panel Allocation", title_format)
            worksheet.merge_range('A7:G7', "Academic Year: 2024-25", subtitle_format)

        
            worksheet.set_column('A:A', 6)  
            worksheet.set_column('B:B', 10) 
            worksheet.set_column('C:C', 15)  
            worksheet.set_column('D:D', 30)  
            worksheet.set_column('E:E', 45)  
            worksheet.set_column('F:F', 35)  
            worksheet.set_column('G:G', 35) 

            headers = ["Sr. No.", "Group Number", "Moodle ID", "Name of the Student", "Project Topic", "Project Guide and Co-Guide", "Panel Members"]
            for col_num, header in enumerate(headers):
                worksheet.write(8, col_num, header, header_format)

            row = 9 
            sr_no = 1

            for panel in panels:
                panel_members = ", ".join([f"{t.user.first_name} {t.user.last_name}" for t in panel.teachers.all()])
                for group in panel.groups.all():
                    students = [group.leader] + list(group.members.all())
                    group_size = len(students)
                    guide_info =""
                    if group.project_guide:
                        guide_info = get_full_name(group.project_guide)
                    if group.project_co_guide:
                        guide_info += f" & {get_full_name(group.project_co_guide)}"

                   
                    if group_size > 1:
                        worksheet.merge_range(row, 0, row + group_size - 1, 0, sr_no, merged_format)
                        worksheet.merge_range(row, 1, row + group_size - 1, 1, group.group_no, merged_format)
                        worksheet.merge_range(row, 5, row + group_size - 1, 5, guide_info, merged_format)
                        worksheet.merge_range(row, 6, row + group_size - 1, 6, panel_members, merged_format)
                        worksheet.merge_range(row, 4, row + group_size - 1, 4, group.final_topic or "", merged_format)
                    else:
                        worksheet.write(row, 0, sr_no, merged_format)
                        worksheet.write(row, 1, group.group_no, merged_format)
                        worksheet.write(row, 4, group.final_topic or "", cell_format)
                        worksheet.write(row, 5, guide_info, cell_format)
                        worksheet.write(row, 6, panel_members, cell_format)

                    for student in students:
                        worksheet.write(row, 2, student.user.username, cell_format)  
                        full_name = f"{student.user.first_name} {student.middle_name or ''} {student.user.last_name}".strip()
                        worksheet.write(row, 3, full_name, cell_format)  
                        row += 1

                    sr_no += 1

            workbook.close()
            output.seek(0)

            response = HttpResponse(output.read(), content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = f'attachment; filename=Panel_Allocation_{event.name}.xlsx'
            return response

        except Exception as e:
            return HttpResponse(f"Error generating Excel: {e}", status=500)


    # @action(detail=False, methods=['get'], url_path='assessment-marks')
    # def assessment_excel(self, request):
    #     try:
    #         event = request.query_params.get('event_id', None)

    #         assessment = AssessmentEvent.objects.get(id=event)
    #         rubrics = AssessmentRubric.objects.filter(event=assessment)



    #         if not weekno or not weekno.isdigit():
    #             return Response({"error": "Invalid or missing week number"}, status=status.HTTP_400_BAD_REQUEST)

    #         sem = None if (not sem or sem.lower() == "null") else sem.strip()
    #         div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

    #         dept = Department.objects.filter(name__iexact=category).first()
    #         if not dept:
    #             return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

    #         y = Year.objects.filter(department=dept, year=year).first()
    #         if not y:
    #             return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

    #         if div is not None:
    #             semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
    #         else:
    #             semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()
            
    #         if semester:
    #             project_coordinator = semester.project_coordinator
    #             project_co_coordinator = semester.project_co_coordinator
    #             class_incharge = semester.class_incharge
            
    #         sem_value = None
    #         if sem == "Major Project":  # or whatever the correct condition is
    #             sem_value = request.query_params.get('sem_new', None)

    #         hod = Teacher.objects.filter(department=dept, role__name="Head of Department").first()
    #         footer_data = [
    #             (project_coordinator, "Project Co-Coordinator"),
    #             (project_co_coordinator, "Project Co-ordinator"),
    #             (class_incharge, "Class In-charge"),
    #             (hod, "HOD")
    #         ]
    #         # projects = Project.objects.filter(sem=semester).order_by("div","id")
    #         # print(projects)
    #         print(sem_value)
    #         print("Requested Week:", weekno)
    #         print("Semester:", semester)
    #         matching_week = Week.objects.filter(semester=semester, week_number=int(weekno)).first()
    #         print("Matching Week:", matching_week)
    #         completed_projects_ids = ProjectWeekProgress.objects.filter(
    #             week__semester=semester,
    #             week__sem = sem_value,
    #             week__week_number=int(weekno),
    #             is_final=True
    #         ).values_list('project_id', flat=True)
    #         print(completed_projects_ids)

    #         projects = Project.objects.filter(
    #             id__in=completed_projects_ids
    #         ).order_by("div", "id")

    #         print(projects)
    #         project_data = []

    #         div_count = {}
    #         index = 1
    #         for project in projects:
    #             if project.div not in div_count:
    #                 div_count[project.div] = 1 
    #             else:
    #                 div_count[project.div] += 1
                
    #             group_code = f"{project.div}{div_count[project.div]}"
                
    #             moodle_ids = []
    #             student_names = []

    #             def get_full_name(student):
    #                 name_parts = [student.user.first_name]
    #                 if student.middle_name:  
    #                     name_parts.append(student.middle_name)
    #                 name_parts.append(student.user.last_name)
    #                 return " ".join(name_parts)

    #             if project.leader:
    #                 moodle_ids.append(project.leader.user.username)
    #                 student_names.append(get_full_name(project.leader))

    #             if project.members.exists():
    #                 moodle_ids.extend([member.user.username for member in project.members.all()])
    #                 student_names.extend([get_full_name(member) for member in project.members.all()])
                
    #             teacher = []
    #             if project.project_guide:
    #                 teacher.append(get_full_name(project.project_guide))
    #             if project.project_co_guide:
    #                 teacher.append(get_full_name(project.project_co_guide))

    #             project_data.append([index,project.group_no,moodle_ids,student_names,"\n".join(teacher)])

    #             index+=1
    #         print(project_data)

            
    #         output = BytesIO()

    #         workbook = xlsxwriter.Workbook(output, {'in_memory': True})
    #         worksheet = workbook.add_worksheet('Guide Allocation Report')

    #         title_format = workbook.add_format({
    #             'bold': True,
    #             'font_size': 14,
    #             'align': 'center',
    #             'valign': 'vcenter'
    #         })

    #         subtitle_format = workbook.add_format({
    #             'bold': True,
    #             'font_size': 12,
    #             'align': 'center',
    #             'valign': 'vcenter'
    #         })

    #         header_format = workbook.add_format({
    #             'bold': True,
    #             # 'bg_color': '#D3D3D3',
    #             'border': 1,
    #             'align': 'center',
    #             'valign': 'vcenter'
    #         })

    #         cell_format = workbook.add_format({
    #             'border': 1,
    #             'align': 'left',
    #             'valign': 'vcenter'
    #         })

    #         merged_cell_format = workbook.add_format({
    #             'border': 1,
    #             'align': 'center',
    #             'valign': 'vcenter'
    #         })

    #         merged_guide_format = workbook.add_format({
    #             'border': 1,
    #             'align': 'center',
    #             'valign': 'vcenter',
    #             'text_wrap': True  
    #         })

    #         image_path = os.path.join(settings.BASE_DIR, 'images', 'image.png')
    #         worksheet.insert_image('B1', image_path, {'x_scale': 1, 'y_scale': 1, 'url': '', 'align': 'center'})
    #         worksheet.set_row(1,40)
            
    #         worksheet.merge_range('A6:F6', "Guide Allocation", title_format)
    #         worksheet.merge_range('A7:F7', "Academic Year: 2024-25", subtitle_format)

            
    #         worksheet.set_column('A:A', 6)  
    #         worksheet.set_column('B:B', 15) 
    #         worksheet.set_column('C:C', 30)  
    #         worksheet.set_column('D:D', 40) 
    #         worksheet.set_column('E:E', 40) 

    #         headers = [
    #             "Sr No", "Group Number", "Moodle Id", "Name of the Student", "Project Topic", "Project Guide & Co-Guide"
    #         ] + [f"{rubric.name} ({rubric.max_marks})" for rubric in rubrics] + ["Total", "Remark"]

    #         for col_num, header in enumerate(headers):
    #             worksheet.write(8, col_num, header, header_format)  
           
    #         row = 9  
    #         for sr_no, group, moodle_ids, students, guide in project_data:
    #             group_size = len(students)  
                
    #             if group_size > 1:
    #                 worksheet.merge_range(row, 0, row + group_size - 1, 0, sr_no, merged_cell_format)  
    #                 worksheet.merge_range(row, 1, row + group_size - 1, 1, group, merged_cell_format)  
    #                 worksheet.merge_range(row, 4, row + group_size - 1, 4, guide, merged_guide_format)  

    #             for i in range(group_size):  
    #                 worksheet.write(row, 2, moodle_ids[i], cell_format)  
    #                 worksheet.write(row, 3, students[i], cell_format)  
    #                 row += 1  

    #         footer_row = row + 10  

    #         footer_format = workbook.add_format({
    #             'bold': True,
    #             'align': 'justify',  
    #             'valign': 'vcenter',
    #             'text_wrap': True 
    #         })


    #         worksheet.set_column('A:D', 25)

    #         # worksheet.write(footer_row, 0, "Mr. Sachin Kasare\n(Project Co-Coordinator)", footer_format)
    #         # worksheet.write(footer_row, 1, "Mr. Vishal Badgujar\n(Project Co-ordinator)", footer_format)
    #         # worksheet.write(footer_row, 2, "Ms. Sonal Balpande\n(Class In-charge)", footer_format)
    #         # worksheet.write(footer_row, 3, "Dr. Kiran Deshpande\n(HOD, Information Technology)", footer_format)

    #         for idx, (teacher, role) in enumerate(footer_data):
    #             if teacher:
    #                 full_name = f"{teacher.user.first_name} {teacher.middle_name if teacher.middle_name else ''} {teacher.user.last_name}".strip()
    #                 worksheet.write(footer_row, idx, f"{full_name}\n({role})", footer_format)

           
    #         for idx, (teacher, role) in enumerate(footer_data):
    #             if not teacher:
    #                 worksheet.write(footer_row, idx, f"Not Available\n({role})", footer_format)

    #         workbook.close()

    #         output.seek(0)
    #         response = HttpResponse(
    #             output,
    #             content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    #         )
    #         response['Content-Disposition'] = 'attachment; filename="guide_allocation.xlsx"'
    #         return response

    #     except Exception as e:
    #         return HttpResponse(f"Error generating Excel: {e}", status=500)

    @action(detail=False, methods=['get'], url_path='assessment-report')
    def export_excel(self, request):
        try:
            event_id = request.query_params.get('event_id')
            if not event_id or not event_id.isdigit():
                return Response({"error": "Invalid or missing event_id"}, status=status.HTTP_400_BAD_REQUEST)

            event = AssessmentEvent.objects.filter(id=int(event_id)).first()
            if not event:
                return Response({"error": "AssessmentEvent not found"}, status=status.HTTP_404_NOT_FOUND)

            rubrics = AssessmentRubric.objects.filter(event=event)
            assessments = ProjectAssessment.objects.filter(event=event).select_related(
                'project__leader', 'project__project_guide', 'project__project_co_guide'
            ).prefetch_related('project__members', 'marks')

            # EXCEL GENERATION
            output = BytesIO()
            workbook = xlsxwriter.Workbook(output, {'in_memory': True})
            image_path = os.path.join(settings.BASE_DIR, 'images', 'image.png')
            
            worksheet = workbook.add_worksheet('Assessment Report')
            worksheet.insert_image('B1', image_path, {'x_scale': 1, 'y_scale': 1, 'url': '', 'align': 'center'})

            # Formats
            title_format = workbook.add_format({'bold': True, 'font_size': 14, 'align': 'center', 'valign': 'vcenter'})
            header_format = workbook.add_format({'bold': True, 'border': 1, 'align': 'center', 'valign': 'vcenter', 'text_wrap': True})
            cell_format = workbook.add_format({'border': 1, 'align': 'left', 'valign': 'vcenter', 'text_wrap': True})
            center_format = workbook.add_format({'border': 1, 'align': 'center', 'valign': 'vcenter', 'text_wrap': True})

            # Title and spacing
            worksheet.merge_range('A8:H8', f"{event.name} Evaluation Sheet", title_format)

            # Headers
            base_headers = ["Sr No", "Group Number", "Moodle ID", "Name of the Student", "Project Topic", "Project Guide & Co-Guide"]
            rubric_headers = [f"{rubric.name} ({rubric.max_marks})" for rubric in rubrics]
            full_headers = base_headers + rubric_headers + ["Total", "Remark"]

            for col_num, header in enumerate(full_headers):
                worksheet.write(11, col_num, header, header_format)

            # Data
            row = 12
            sr_no = 1

            cell_format = workbook.add_format({
                'border': 1,
                'align': 'left',
                'valign': 'vcenter'
            })

            merged_cell_format = workbook.add_format({
                'border': 1,
                'align': 'center',
                'valign': 'vcenter',
                'text_wrap': True 
            })

            merged_guide_format = workbook.add_format({
                'border': 1,
                'align': 'center',
                'valign': 'vcenter',
                'text_wrap': True  
            })
            
            def get_full_name(std):
                return f"{std.user.first_name} {std.middle_name or ''} {std.user.last_name}".strip()

            for assessment in assessments:
                project = assessment.project
                students = [project.leader] + list(project.members.all())
                guide = ""
                if project.project_guide:
                    guide += get_full_name(project.project_guide)
                if project.project_co_guide:
                    guide += f" & {get_full_name(project.project_co_guide)}"

                marks_dict = {m.rubric_id: m.marks for m in assessment.marks.all()}
                total_marks = sum(marks_dict.get(r.id, 0) for r in rubrics)

                group_size = len(students) 

                if group_size > 1:
                    worksheet.merge_range(row, 0, row + group_size - 1, 0, sr_no, merged_cell_format)  
                    worksheet.merge_range(row, 1, row + group_size - 1, 1, project.group_no, merged_cell_format)  
                    worksheet.merge_range(row, 4, row + group_size - 1, 4, project.final_topic or "", merged_cell_format)  
                    worksheet.merge_range(row, 5, row + group_size - 1, 5, guide, merged_guide_format)  
                    worksheet.merge_range(row, len(full_headers)-1, row + group_size - 1, len(full_headers)-1, assessment.remarks or "", merged_cell_format)  

                for student in students:
                    worksheet.write(row, 2, student.user.username, cell_format)
                    worksheet.write(row, 3, get_full_name(student), cell_format)

                    col = 6
                    for rubric in rubrics:
                        worksheet.write(row, col, marks_dict.get(rubric.id, ""), center_format)
                        col += 1

                    worksheet.write(row, col, total_marks, center_format)
                    sr_no += 1
                    row += 1

            # Adjust column widths
            worksheet.set_column('A:A', 8)
            worksheet.set_column('B:B', 15)
            worksheet.set_column('C:C', 15)
            worksheet.set_column('D:D', 25)
            worksheet.set_column('E:E', 25)
            worksheet.set_column('F:F', 30)
            for i in range(6, 6 + len(rubrics) + 2):  # rubrics + total + remark
                worksheet.set_column(i, i, 15)

            workbook.close()
            output.seek(0)
            response = HttpResponse(output, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = f'attachment; filename=Assessment_Report_{event.name}.xlsx'
            return response

        except Exception as e:
            return HttpResponse(f"Error generating report: {str(e)}", status=500)
    
    @action(detail=False, methods=['get'], url_path='copyright-excel')
    def copyright_excel(self, request):
        try:
            category = request.query_params.get('category', None)
            year = request.query_params.get('year', None)
            sem = request.query_params.get('sem', None)
            div = request.query_params.get('div', None)
            type = request.query_params.get('type',None)
            segment = request.query_params.get('segment', None) 
            print(segment)
            
            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

            
            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            
            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

           
            semester = None
            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()
            print(semester)

            if semester:
                project_coordinator = semester.project_coordinator
                project_co_coordinator = semester.project_co_coordinator
                class_incharge = semester.class_incharge
            
            hod = Teacher.objects.filter(department=dept, role__name="Head of Department").first()
            footer_data = [
                (project_coordinator, "Project Co-Coordinator"),
                (project_co_coordinator, "Project Co-ordinator"),
                (class_incharge, "Class In-charge"),
                (hod, "HOD")
            ]

           
            output = BytesIO()

           
            workbook = xlsxwriter.Workbook(output, {'in_memory': True})
            worksheet = workbook.add_worksheet('Copyright Report')

            
            title_format = workbook.add_format({
                'bold': True,
                'font_size': 14,
                'align': 'center',
                'valign': 'vcenter'
            })

            subtitle_format = workbook.add_format({
                'bold': True,
                'font_size': 12,
                'align': 'center',
                'valign': 'vcenter'
            })

            header_format = workbook.add_format({
                'bold': True,
                # 'bg_color': '#D3D3D3',
                'border': 1,
                'align': 'center',
                'valign': 'vcenter'
            })

            cell_format = workbook.add_format({
                'border': 1,
                'align': 'left',
                'valign': 'vcenter'
            })

            merged_cell_format = workbook.add_format({
                'border': 1,
                'align': 'center',
                'valign': 'vcenter'
            })

            merged_guide_format = workbook.add_format({
                'border': 1,
                'align': 'center',
                'valign': 'vcenter',
                'text_wrap': True  
            })
            date_format = workbook.add_format({'num_format': 'yyyy-mm-dd','border': 1,
                'align': 'center',
                'valign': 'vcenter',
                'text_wrap': True })

            
            image_path = os.path.join(settings.BASE_DIR, 'images', 'image.png')
            worksheet.insert_image('B1', image_path, {'x_scale': 1, 'y_scale': 1, 'url': '', 'align': 'center'})
            worksheet.set_row(1,40)

            if type == "Copyright":
                publications = Copyright.objects.filter(sem=semester,project__div=segment)
                print(publications)
            elif type == "Patent":
                publications = Patent.objects.filter(sem=semester,project__div=segment)
                print(publications)
            def get_full_name(student):
                name_parts = [student.user.first_name]
                if student.middle_name:  
                    name_parts.append(student.middle_name)
                name_parts.append(student.user.last_name)
                return " ".join(name_parts)
            data = []
            sr_no = 1
            for pub in publications:
                project = pub.project
                group_number = f"A{project.id}"  
                students = []
                for member in project.members.all():
                    students.append(get_full_name(member))
                if project.leader:
                    students.insert(0, get_full_name(project.leader))  

                topic = project.final_topic or "N/A"

                
                guide = get_full_name(project.project_guide) if project.project_guide else ""
                co_guide = get_full_name(project.project_co_guide) if project.project_co_guide else ""
                guide_str = f"{guide}\n{co_guide}" if co_guide else guide

                
                paper_name = pub.project_title
                
                publication_status = pub.status
                publication_date = pub.filing_date
                reg_no = pub.registration_number
                data.append([sr_no, group_number, students, topic, guide_str, paper_name, publication_date, publication_status, reg_no])
                sr_no += 1
            print(data)

            worksheet.merge_range('A6:I6', f"{type} Status", title_format)
            worksheet.merge_range('A7:I7', f"Academic Year: {year}", subtitle_format)

            
            worksheet.set_column('A:A', 6)  
            worksheet.set_column('B:B', 15)  
            worksheet.set_column('C:C', 25) 
            worksheet.set_column('D:D', 40)  
            worksheet.set_column('E:E', 30)  
            worksheet.set_column('F:F', 40)  
            worksheet.set_column('G:G', 25)
            worksheet.set_column('H:H', 25)
            worksheet.set_column('I:I', 25)
            

            headers = ["Sr. No.", "Group Number", "Name of Student", "Name of the Project", "Project Guide & Co-Guide", "Title", "Filing Date","Status","Registration No."]
            for col_num, header in enumerate(headers):
                worksheet.write(8, col_num, header, header_format)  
            row = 9  
            for sr_no, group, students, topic, guide, title, date, status, reg in data:
                group_size = len(students)  
                
                if group_size > 1:
                    worksheet.merge_range(row, 0, row + group_size - 1, 0, sr_no, merged_cell_format)  
                    worksheet.merge_range(row, 1, row + group_size - 1, 1, group, merged_cell_format) 
                    worksheet.merge_range(row, 3, row + group_size - 1, 3, topic, merged_guide_format) 
                    worksheet.merge_range(row, 4, row + group_size - 1, 4, guide, merged_guide_format) 
                    worksheet.merge_range(row, 5, row + group_size - 1, 5, title, merged_guide_format)
                    worksheet.merge_range(row, 6, row + group_size - 1, 6, date, date_format)
                    worksheet.merge_range(row, 7, row + group_size - 1, 7, status, merged_guide_format)
                    worksheet.merge_range(row, 8, row + group_size - 1, 8, reg, merged_guide_format)

                for i in range(group_size):
                    worksheet.write(row, 2, students[i], cell_format) 
                    row += 1  
            
            footer_row = row + 10  

            footer_format = workbook.add_format({
                'bold': True,
                'align': 'justify',  
                'valign': 'vcenter',
                'text_wrap': True  
            })

            worksheet.set_column('A:D', 25)

            
            for idx, (teacher, role) in enumerate(footer_data):
                if teacher:
                    full_name = f"{teacher.user.first_name} {teacher.middle_name if teacher.middle_name else ''} {teacher.user.last_name}".strip()
                    worksheet.write(footer_row, idx, f"{full_name}\n({role})", footer_format)

           
            for idx, (teacher, role) in enumerate(footer_data):
                if not teacher:
                    worksheet.write(footer_row, idx, f"Not Available\n({role})", footer_format)

            workbook.close()


            output.seek(0)
            response = HttpResponse(
                output,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename="guide_allocation.xlsx"'
            return response

        except Exception as e:
            return HttpResponse(f"Error generating Excel: {e}", status=500)
    
    @action(detail=False, methods=['get'], url_path='publication-excel')
    def publication_excel(self, request):
        try:
            category = request.query_params.get('category', None)
            year = request.query_params.get('year', None)
            sem = request.query_params.get('sem', None)
            div = request.query_params.get('div', None)
            segment = request.query_params.get('segment', None)  
            print(segment)

            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

            
            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            
            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

            
            semester = None
            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()
            print(semester)
            
            publications = Publication.objects.filter(sem=semester,project__div=segment)
            print(publications)
            def get_full_name(student):
                name_parts = [student.user.first_name]
                if student.middle_name: 
                    name_parts.append(student.middle_name)
                name_parts.append(student.user.last_name)
                return " ".join(name_parts)
            data = []
            sr_no = 1
            for pub in publications:
                project = pub.project
                group_number = f"A{project.id}"  # Or whatever logic you have for group numbers

                # Get all students (leader + members)
                students = []
                for member in project.members.all():
                    students.append(get_full_name(member))
                if project.leader:
                    students.insert(0, get_full_name(project.leader))  # leader comes first

                topic = project.final_topic or "N/A"

                # Get guide & co-guide names
                guide = get_full_name(project.project_guide) if project.project_guide else ""
                co_guide = get_full_name(project.project_co_guide) if project.project_co_guide else ""
                guide_str = f"{guide}\n{co_guide}" if co_guide else guide

                # Paper and publication details
                paper_name = pub.paper_name
                # publication_type = "Conference"  # You can change this if needed
                publication_name = pub.conference_name
                publication_date = pub.conference_date # You can make this dynamic if needed

                data.append([sr_no, group_number, students, topic, guide_str, paper_name, publication_name, publication_date])
                sr_no += 1
            print(data)

            if semester:
                project_coordinator = semester.project_coordinator
                project_co_coordinator = semester.project_co_coordinator
                class_incharge = semester.class_incharge
            
            hod = Teacher.objects.filter(department=dept, role__name="Head of Department").first()
            footer_data = [
                (project_coordinator, "Project Co-Coordinator"),
                (project_co_coordinator, "Project Co-ordinator"),
                (class_incharge, "Class In-charge"),
                (hod, "HOD")
            ]

            output = BytesIO()

            workbook = xlsxwriter.Workbook(output, {'in_memory': True})
            worksheet = workbook.add_worksheet('Publication Report')

            title_format = workbook.add_format({
                'bold': True,
                'font_size': 14,
                'align': 'center',
                'valign': 'vcenter'
            })

            subtitle_format = workbook.add_format({
                'bold': True,
                'font_size': 12,
                'align': 'center',
                'valign': 'vcenter'
            })

            header_format = workbook.add_format({
                'bold': True,
                # 'bg_color': '#D3D3D3',
                'border': 1,
                'align': 'center',
                'valign': 'vcenter'
            })

            cell_format = workbook.add_format({
                'border': 1,
                'align': 'left',
                'valign': 'vcenter'
            })

            merged_cell_format = workbook.add_format({
                'border': 1,
                'align': 'center',
                'valign': 'vcenter'
            })

            merged_guide_format = workbook.add_format({
                'border': 1,
                'align': 'center',
                'valign': 'vcenter',
                'text_wrap': True  # Enables multi-line text wrapping
            })
            date_format = workbook.add_format({'num_format': 'yyyy-mm-dd','border': 1,
                'align': 'center',
                'valign': 'vcenter',
                'text_wrap': True })

            # Insert Image (Institute Logo)
            image_path = os.path.join(settings.BASE_DIR, 'images', 'image.png')
            worksheet.insert_image('B1', image_path, {'x_scale': 1, 'y_scale': 1, 'url': '', 'align': 'center'})
            worksheet.set_row(1,40)
            # Merge Cells for Titles & Subtitles
            worksheet.merge_range('A6:H6', "Publication Status", title_format)
            worksheet.merge_range('A7:H7', f"Academic Year: {year}", subtitle_format)

            # Define column widths
            worksheet.set_column('A:A', 3)  
            worksheet.set_column('B:B', 7)  
            worksheet.set_column('C:C', 15)  
            worksheet.set_column('D:D', 30)  
            worksheet.set_column('E:E', 30)  
            worksheet.set_column('F:F', 40)
            worksheet.set_column('G:G', 40) 
            worksheet.set_column('H:H', 20) 
            # Write the header
            headers = ["Sr. No.", "Group Number", "Name of Student", "Name of the Project", "Project Guide & Co-Guide", "Paper Name","Conference Name","Conference Date"]
            for col_num, header in enumerate(headers):
                worksheet.write(8, col_num, header, header_format)  # Start header at row 9 (index 8)

            # Sample structured data (Each group has multiple students)
            # data = [
            #     [1, "A5", ["Prakruti Bhavsar","Payal Gupta","Akanksha Bhoir","Nimisha Idekar"],"ProjectSpace: A Comprehensive Webframework to Manage Academic Projects by using Genetic Algorithms and Machine Learning", 
            #     "Mr. Vishal S. Badgujar \n Ms. Seema Jadhav","ProjectSpace: A Comprehensive Framework forAutomated Project Guide Allocation in Academic Institutions","Conference","6th Doctoral Symposium on Computational Intelligence (DoSCI-2025)","Accepted & Registered"],

            # ]
        
            row = 9  # Start writing data from row 10
            for sr_no, group, students, topic, guide, paper, name, date in data:
                group_size = len(students)  # Number of students in this group
                
                # Merge Sr. No., Group Number, and Project Guide columns for the whole group
                if group_size > 1:
                    worksheet.merge_range(row, 0, row + group_size - 1, 0, sr_no, merged_cell_format)  # Sr. No.
                    worksheet.merge_range(row, 1, row + group_size - 1, 1, group, merged_cell_format) 
                    worksheet.merge_range(row, 3, row + group_size - 1, 3, topic, merged_guide_format) # Group Number
                    worksheet.merge_range(row, 4, row + group_size - 1, 4, guide, merged_guide_format)  # Project Guide # Project Guide
                    worksheet.merge_range(row, 5, row + group_size - 1, 5, paper, merged_guide_format)
                    # worksheet.merge_range(row, 6, row + group_size - 1, 6, type, merged_guide_format)
                    worksheet.merge_range(row, 6, row + group_size - 1, 6, name, merged_guide_format)
                    worksheet.merge_range(row, 7, row + group_size - 1, 7, date, date_format)

                for i in range(group_size):
                    worksheet.write(row, 2, students[i], cell_format)  # Student Name
                    row += 1  # Move to next row

            # Determine footer row (10 rows below the last row of the table)
            footer_row = row + 10  

            footer_format = workbook.add_format({
                'bold': True,
                'align': 'justify',  # Justifies the text within the merged cell
                'valign': 'vcenter',
                'text_wrap': True  # Enables multi-line text wrapping
            })

            worksheet.set_column('A:D', 25)

            # # Write footer text in separate columns for proper alignment
            # worksheet.write(footer_row, 0, "Mr. Sachin Kasare\n(Project Co-Coordinator)", footer_format)
            # worksheet.write(footer_row, 1, "Mr. Vishal Badgujar\n(Project Co-ordinator)", footer_format)
            # worksheet.write(footer_row, 2, "Ms. Sonal Balpande\n(Class In-charge)", footer_format)
            # worksheet.write(footer_row, 3, "Dr. Kiran Deshpande\n(HOD, Information Technology)", footer_format)
            for idx, (teacher, role) in enumerate(footer_data):
                if teacher:
                    full_name = f"{teacher.user.first_name} {teacher.middle_name if teacher.middle_name else ''} {teacher.user.last_name}".strip()
                    worksheet.write(footer_row, idx, f"{full_name}\n({role})", footer_format)

            # Optionally, if any teacher data is missing, you can provide a default value like "Not Available"
            for idx, (teacher, role) in enumerate(footer_data):
                if not teacher:
                    worksheet.write(footer_row, idx, f"Not Available\n({role})", footer_format)
            # Close the workbook
            workbook.close()

            # Prepare the HTTP response
            output.seek(0)
            response = HttpResponse(
                output,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename="guide_allocation.xlsx"'
            return response

        except Exception as e:
            return HttpResponse(f"Error generating Excel: {e}", status=500)
        
    @action(detail=False, methods=['get'], url_path='generate-logbook-page')
    def generate_logbook_page(self, request):
        try:
            def header(canvas, doc):
                try:
                    image_path = os.path.join(settings.BASE_DIR, 'images', 'image.png')  # Ensure correct image path
                    canvas.drawImage(image_path, 30, 750, width=530, height=80)  # Adjust dimensions as needed

                    # canvas.showPage()  # Ensure the page is properly initiated
                except Exception as e:
                    print(f"Error in header function: {e}")

            # Create an HTTP response with PDF content type
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = 'inline; filename="weekly_logbook.pdf"'

            # Define the PDF document
            doc = SimpleDocTemplate(response, pagesize=A4)

            frame = Frame(30, 50, 535, 690, id='normal')  # Leave space for header

            # Apply the header function to each page
            template = PageTemplate(id='header_template', frames=frame, onPage=header)
            doc.addPageTemplates([template])

            # if not callable(header):
            #     return HttpResponse("Error: header function is not defined", status=500)

            # Create a list to hold elements for the PDF
            elements = []

            # Sample styles
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                "TitleStyle",
                parent=styles["Title"],
                fontName="Times-Roman",  # Use "Times-Roman" for Times New Roman
                fontSize=12,
                spaceAfter=1,  # Space below the title  # Space below the title
                alignment=TA_CENTER,  # Center alignment  # Underline text
                textColor=colors.black,  # Center alignment
            )

            agenda_style = ParagraphStyle(
                "AgendaStyle",
                parent=styles["BodyText"],
                fontName="Times-Roman",
                fontSize=12,
                leftIndent=10,  # Indent for bullet points
                spaceAfter=5,  # Space below the title
                
            )

            # Title
            elements.append(Paragraph("<b><u>Project Weekly Report</u></b>", title_style))
            # elements.append(Spacer(1, 5))  # Space below the title

            data = [["Group No.: 5", "Week No.: 2", "Date: 2025-02-27"]]

            # Create a table with equal column widths
            table_header = Table(data, colWidths=[220, 220, 220])  # Adjust width for equal spacing

            # Style the table
            table_header.setStyle(TableStyle([
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),  # Center text in all columns
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                ("FONTNAME", (0, 0), (-1, -1), "Times-Roman"),
                ("FONTSIZE", (0, 0), (-1, -1), 12),
            ]))

            # Add to elements list
            elements.append(table_header)
            elements.append(Spacer(1,15))

            # Agenda section
            elements.append(Paragraph("<b>Agenda:</b>", agenda_style))
            elements.append(Spacer(1, 5))  # Space after "Agenda:"

            points_style = ParagraphStyle(
                "PointsStyle",
                fontName="Times-Roman",
                fontSize=12,
                leftIndent=25,  # Adjust this value to move text to the right
                spaceAfter=5,
            )

            # Bullet points for agenda
            agenda_points = [
                "To participate in project orientation conducted by department.",
                "To discuss feasibility of project ideas proposed with guide.",
                "To present at least three topics as per the guidelines given by department."
            ]

            for point in agenda_points:
                elements.append(Paragraph(f"• {point}", points_style))

            elements.append(Spacer(1, 12)) 
            
            body_style = ParagraphStyle(
                "BodyStyle",
                parent=styles["BodyText"],
                fontName="Times-Roman",
                fontSize=12,
                leading=14,  # Line spacing
                # spaceAfter=5,  # Space below each paragraph
                alignment=0,  # Left align text
            )

            table_data = [
                [Paragraph("<b>Progress Status</b>", title_style)],  # Centered bold header
                [Paragraph("Have participated in project orientation conducted by department on given date", body_style)],
                [Paragraph("Discussed feasibility of project ideas proposed with guide", body_style)],
                [Paragraph("Presented at least three topics as per the guidelines given by department", body_style)],
                [Paragraph("", body_style)],  # Empty row for spacing
            ]

            row_heights = [25, 70, 70, 70, 70]

            table_status = Table(table_data, colWidths=[500], rowHeights=row_heights)  # Adjust width to fit page

            # Style the table
            table_status.setStyle(TableStyle([
                # ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),  # Header background
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('FONTNAME', (0, 0), (-1, 0), 'Times-Bold'),  # Bold header
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),  # Center align header
                ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),  # Vertically center header
                ('FONTNAME', (0, 1), (-1, -1), 'Times-Roman'),  # Body font
                ('FONTSIZE', (0, 1), (-1, -1), 12),  # Body font size
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                ('ALIGN', (0, 1), (-1, -1), 'LEFT'),  # Align text left for content
                ('VALIGN', (0, 1), (-1, -1), 'TOP'),  # Align all left
                ('FONTSIZE', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 2),
                ('TOPPADDING', (0, 0), (-1, 0), 2),
                ('WORDWRAP', (0, 1), (-1, -1), True),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),  # Add border
            ]))

            # Add table to elements list
            elements.append(table_status)

            signature_style = ParagraphStyle(
                "SignatureStyle",
                fontName="Times-Roman",
                fontSize=12,
                leading=14,  # Line spacing
                leftIndent=10,  # Left align text
            )

            # Signature content
            signature_text = """
            Signature:<br/><br/>
            Team Member 1:<br/><br/>
            Team Member 2:<br/><br/>
            Team Member 3:<br/><br/>
            Team Member 4:<br/><br/>
            Project Guide/Co-Guide Name:<br/><br/>
            Signature:
            """

            # Create paragraph for the signature section
            signature_paragraph = Paragraph(signature_text, signature_style)

            # Add to PDF elements
            elements.append(Spacer(1, 20))  # Space before signature section
            elements.append(signature_paragraph)

            

            doc.build(elements)

            return response
        except Exception as e:
            return HttpResponse(f"Error generating PDF: {e}", status=500)
    
    @action(detail=False, methods=['post'], url_path='generate-logbook-page-pdf')
    def generate_logbook_page(self, request):
        try:
            data = request.data
            week_id = data.get("week_id")
            project_id = data.get("project_id")
            print(week_id)
            print(project_id)
            # Validate week_id and project_id
            if not week_id or not project_id:
                return HttpResponse("Week ID and Project ID are required", status=400)

            # Retrieve the Week and Project objects
            week = Week.objects.get(id=week_id)
            project = Project.objects.get(id=project_id)

            # Retrieve tasks related to this week
            tasks = Task.objects.filter(week=week).order_by('sequence_number')

            # Retrieve ProjectWeekProgress for the given project and week
            progress = ProjectWeekProgress.objects.get(project=project, week=week)

            selected_week = week.week_number
            date = progress.submitted_date.strftime('%Y-%m-%d')  # Format the date
            completion_percentage = progress.completion_percentage
            remarks = progress.remarks

            project_tasks = ProjectTask.objects.filter(project=project, task__week=week)

            team_members = [project.leader] + list(project.members.all())

            # Get guide and co-guide
            project_guide = project.project_guide
            project_co_guide = project.project_co_guide

            def header(canvas, doc):
                try:
                    image_path = os.path.join(settings.BASE_DIR, 'images', 'image.png')  # Ensure correct image path
                    canvas.drawImage(image_path, 30, 750, width=530, height=80)  # Adjust dimensions as needed

                    # canvas.showPage()  # Ensure the page is properly initiated
                except Exception as e:
                    print(f"Error in header function: {e}")

            # Create an HTTP response with PDF content type
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = 'inline; filename="weekly_logbook.pdf"'

            # Define the PDF document
            doc = SimpleDocTemplate(response, pagesize=A4)

            frame = Frame(30, 50, 535, 690, id='normal')  # Leave space for header

            # Apply the header function to each page
            template = PageTemplate(id='header_template', frames=frame, onPage=header)
            doc.addPageTemplates([template])

            # if not callable(header):
            #     return HttpResponse("Error: header function is not defined", status=500)

            # Create a list to hold elements for the PDF
            elements = []

            # Sample styles
            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                "TitleStyle",
                parent=styles["Title"],
                fontName="Times-Roman",  # Use "Times-Roman" for Times New Roman
                fontSize=12,
                spaceAfter=1,  # Space below the title  # Space below the title
                alignment=TA_CENTER,  # Center alignment  # Underline text
                textColor=colors.black,  # Center alignment
            )

            agenda_style = ParagraphStyle(
                "AgendaStyle",
                parent=styles["BodyText"],
                fontName="Times-Roman",
                fontSize=12,
                leftIndent=10,  # Indent for bullet points
                spaceAfter=5,  # Space below the title
                
            )

            # Title
            elements.append(Paragraph("<b><u>Project Weekly Report</u></b>", title_style))
            # elements.append(Spacer(1, 5))  # Space below the title

            data = [[f"Group No.: {project.group_no}", f"Week No.: {selected_week}", f"Date: {date}"]]

            # Create a table with equal column widths
            table_header = Table(data, colWidths=[220, 220, 220])  # Adjust width for equal spacing

            # Style the table
            table_header.setStyle(TableStyle([
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),  # Center text in all columns
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                ("FONTNAME", (0, 0), (-1, -1), "Times-Roman"),
                ("FONTSIZE", (0, 0), (-1, -1), 12),
            ]))

            # Add to elements list
            elements.append(table_header)
            elements.append(Spacer(1,15))

            # Agenda section
            elements.append(Paragraph("<b>Agenda:</b>", agenda_style))
            elements.append(Spacer(1, 5))  # Space after "Agenda:"

            points_style = ParagraphStyle(
                "PointsStyle",
                fontName="Times-Roman",
                fontSize=12,
                leftIndent=25,  # Adjust this value to move text to the right
                spaceAfter=5,
            )

            # Bullet points for agenda
            # agenda_points = [
            #     "To participate in project orientation conducted by department.",
            #     "To discuss feasibility of project ideas proposed with guide.",
            #     "To present at least three topics as per the guidelines given by department."
            # ]

            agenda_points = [task.task for task in tasks]

            for point in agenda_points:
                elements.append(Paragraph(f"• {point}", points_style))

            elements.append(Spacer(1, 12)) 
            
            body_style = ParagraphStyle(
                "BodyStyle",
                parent=styles["BodyText"],
                fontName="Times-Roman",
                fontSize=12,
                leading=14,  # Line spacing
                # spaceAfter=5,  # Space below each paragraph
                alignment=0,  # Left align text
            )

            # table_data = [
            #     [Paragraph("<b>Progress Status</b>", title_style)],  # Centered bold header
            #     [Paragraph("Have participated in project orientation conducted by department on given date", body_style)],
            #     [Paragraph("Discussed feasibility of project ideas proposed with guide", body_style)],
            #     [Paragraph("Presented at least three topics as per the guidelines given by department", body_style)],
            #     [Paragraph("", body_style)],  # Empty row for spacing
            # ]

            table_data =[[Paragraph("<b>Progress Status</b>", title_style)]]

            for project_task in project_tasks:
                task_description = project_task.details if project_task.details else ""
                if task_description.strip():
                    table_data.append([Paragraph(f"{task_description}", body_style)])

            table_data.append([Paragraph(remarks, body_style)])
            

            print(len(table_data))

            print(table_data)

            expected_rows = 5  # This can be any value you define

            # Add empty rows if the table has fewer rows than expected
            if len(table_data) < expected_rows:
                # Add the difference as empty rows
                for _ in range(expected_rows - len(table_data)):
                    table_data.append([Paragraph("", body_style)])

            # Combine rows if the table has more rows than expected
            if len(table_data) > expected_rows:
                # You can define how to combine rows, for now, we'll just merge them in a simple way
                # For example, you can join the text content of the paragraphs
                combined_data = []
                for i in range(0, len(table_data), 2):  # Combine every two rows
                    combined_text = ""
                    if i < len(table_data):
                        combined_text += table_data[i][0].getPlainText()
                    if i + 1 < len(table_data):
                        combined_text += " " + table_data[i + 1][0].getPlainText()

                    combined_data.append([Paragraph(combined_text, body_style)])

                table_data = combined_data

            row_heights = [25, 70, 70, 70, 70]

            table_status = Table(table_data, colWidths=[500], rowHeights=row_heights)  # Adjust width to fit page

            # Style the table
            table_status.setStyle(TableStyle([
                # ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),  # Header background
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('FONTNAME', (0, 0), (-1, 0), 'Times-Bold'),  # Bold header
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),  # Center align header
                ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),  # Vertically center header
                ('FONTNAME', (0, 1), (-1, -1), 'Times-Roman'),  # Body font
                ('FONTSIZE', (0, 1), (-1, -1), 12),  # Body font size
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                ('ALIGN', (0, 1), (-1, -1), 'LEFT'),  # Align text left for content
                ('VALIGN', (0, 1), (-1, -1), 'TOP'),  # Align all left
                ('FONTSIZE', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 2),
                ('TOPPADDING', (0, 0), (-1, 0), 2),
                ('WORDWRAP', (0, 1), (-1, -1), True),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),  # Add border
            ]))

            # Add table to elements list
            elements.append(table_status)

            signature_style = ParagraphStyle(
                "SignatureStyle",
                fontName="Times-Roman",
                fontSize=12,
                leading=14,  # Line spacing
                leftIndent=10,  # Left align text
            )

            # Signature content
            # signature_text = """
            # Signature:<br/><br/>
            # Team Member 1: Prakruti Bhavsar<br/><br/>
            # Team Member 2: Akanksha bhoir<br/><br/>
            # Team Member 3: Payal Gupta<br/><br/>
            # Team Member 4: Nimisha Idekar<br/><br/>
            # Project Guide/Co-Guide Name: Prof. Vishal S. Badgujar      Prof. Seema Jadhav<br/><br/>
            # Signature:
            # """

            signature_lines = ["Signature:<br/><br/>"]

            for idx, member in enumerate(team_members, start=1):
                full_name = f"{member.user.first_name} {member.middle_name or ''} {member.user.last_name}".strip()
                signature_lines.append(f"Team Member {idx}: {full_name}<br/><br/>")

            signature_lines.append("<br/><br/>")
            if project_guide and project_co_guide:
                guide_line = f"Project Guide/Co-Guide Name: {project_guide.title} {project_guide.user.first_name} {project_guide.middle_name or ''} {project_guide.user.last_name} &nbsp;&nbsp;&nbsp;&nbsp; {project_co_guide.title} {project_co_guide.user.first_name} {project_co_guide.middle_name or ''} {project_co_guide.user.last_name}<br/><br/>"
            elif project_guide:
                guide_line = f"Project Guide/Co-Guide Name: {project_guide.title} {project_guide.user.first_name} {project_guide.middle_name or ''} {project_guide.user.last_name}<br/><br/>"
            else:
                guide_line = "Project Guide/Co-Guide Name:"  # no guide? maybe show blank?

            signature_lines.append(guide_line)

            signature_text = "\n".join(signature_lines)

            # Create paragraph for the signature section
            signature_paragraph = Paragraph(signature_text, signature_style)

            # Add to PDF elements
            elements.append(Spacer(1, 20))  # Space before signature section
            elements.append(signature_paragraph)

            

            doc.build(elements)

            return response
        except Exception as e:
            logger.error(f"Error in generate_logbook_page: {str(e)}", exc_info=True) 
            return HttpResponse(f"Error generating PDF: {e}", status=500)

    # @action(detail=False, methods=['post'], url_path='generate-logbook-page-pdf')
    # def generate_logbook_page(self, request):
    #     try:
    #         data = request.data
    #         week_id = data.get("week_id")
    #         project_id = data.get("project_id")

    #         # Validate week_id and project_id
    #         if not week_id or not project_id:
    #             return HttpResponse("Week ID and Project ID are required", status=400)

    #         # Retrieve the Week and Project objects
    #         week = Week.objects.get(id=week_id)
    #         project = Project.objects.get(id=project_id)

    #         # Retrieve tasks related to this week
    #         tasks = Task.objects.filter(week=week).order_by('sequence_number')

    #         # Retrieve ProjectWeekProgress for the given project and week
    #         progress = ProjectWeekProgress.objects.get(project=project, week=week)

    #         selected_week = week.week_number
    #         date = progress.submitted_date.strftime('%Y-%m-%d')  # Format the date
    #         completion_percentage = progress.completion_percentage
    #         remarks = progress.remarks

    #         def header(canvas, doc):
    #             try:
    #                 image_path = os.path.join(settings.BASE_DIR, 'images', 'image.png')
    #                 canvas.drawImage(image_path, 30, 750, width=530, height=80)
    #             except Exception as e:
    #                 print(f"Error in header function: {e}")

    #         # Create an HTTP response with PDF content type
    #         response = HttpResponse(content_type='application/pdf')
    #         response['Content-Disposition'] = 'inline; filename="weekly_logbook.pdf"'

    #         # Define the PDF document
    #         doc = SimpleDocTemplate(response, pagesize=A4)

    #         frame = Frame(30, 50, 535, 690, id='normal')
    #         template = PageTemplate(id='header_template', frames=frame, onPage=header)
    #         doc.addPageTemplates([template])

    #         # Create a list to hold elements for the PDF
    #         elements = []

    #         # Sample styles
    #         styles = getSampleStyleSheet()
    #         title_style = ParagraphStyle(
    #             "TitleStyle",
    #             parent=styles["Title"],
    #             fontName="Times-Roman",
    #             fontSize=12,
    #             spaceAfter=1,
    #             alignment=TA_CENTER,
    #             textColor=colors.black,
    #         )

    #         agenda_style = ParagraphStyle(
    #             "AgendaStyle",
    #             parent=styles["BodyText"],
    #             fontName="Times-Roman",
    #             fontSize=12,
    #             leftIndent=10,
    #             spaceAfter=5,
    #         )

    #         # Title
    #         elements.append(Paragraph("<b><u>BE Project Weekly Report</u></b>", title_style))

    #         data = [["Group No.: A4", f"Week No.: {selected_week}", f"Date: {date}"]]
    #         table_header = Table(data, colWidths=[220, 220, 220])
    #         table_header.setStyle(TableStyle([("ALIGN", (0, 0), (-1, -1), "CENTER")]))
    #         elements.append(table_header)
    #         elements.append(Spacer(1, 15))

    #         # Agenda section
    #         elements.append(Paragraph("<b>Agenda:</b>", agenda_style))
    #         elements.append(Spacer(1, 5))

    #         points_style = ParagraphStyle(
    #             "PointsStyle",
    #             fontName="Times-Roman",
    #             fontSize=12,
    #             leftIndent=25,
    #             spaceAfter=5,
    #         )

    #         # Agenda points based on tasks
    #         agenda_points = [task.task for task in tasks]
    #         for point in agenda_points:
    #             elements.append(Paragraph(f"• {point}", points_style))

    #         elements.append(Spacer(1, 12))

    #         # Body for progress status
    #         body_style = ParagraphStyle(
    #             "BodyStyle",
    #             parent=styles["BodyText"],
    #             fontName="Times-Roman",
    #             fontSize=12,
    #             leading=14,
    #             alignment=0,
    #         )

    #         table_data = [[Paragraph("<b>Progress Status</b>", title_style)]]
    #         table_data.append([Paragraph(remarks, body_style)])

    #         # Add task descriptions to table
    #         for task in tasks:
    #             table_data.append([Paragraph(task.task, body_style)])

    #         row_heights = [25, 70, 70, 70, 70]
    #         table_status = Table(table_data, colWidths=[500], rowHeights=row_heights)
    #         table_status.setStyle(TableStyle([('TEXTCOLOR', (0, 0), (-1, 0), colors.black)]))

    #         # Add table to elements list
    #         elements.append(table_status)

    #         # Signature section
    #         signature_style = ParagraphStyle(
    #             "SignatureStyle",
    #             fontName="Times-Roman",
    #             fontSize=12,
    #             leading=14,
    #             leftIndent=10,
    #         )

    #         signature_text = """
    #         Signature:<br/><br/>
    #         Team Member 1: Prakruti Bhavsar<br/><br/>
    #         Team Member 2: Akanksha Bhoir<br/><br/>
    #         Team Member 3: Payal Gupta<br/><br/>
    #         Team Member 4: Nimisha Idekar<br/><br/>
    #         Project Guide/Co-Guide Name: Prof. Vishal S. Badgujar      Prof. Seema Jadhav<br/><br/>
    #         Signature:
    #         """

    #         signature_paragraph = Paragraph(signature_text, signature_style)
    #         elements.append(Spacer(1, 20))
    #         elements.append(signature_paragraph)

    #         # Build the PDF
    #         doc.build(elements)

    #         return response
    #     except Exception as e:
    #         return HttpResponse(f"Error generating PDF: {e}", status=500)

    @action(detail=False, methods=['get'], url_path='generate-logbook-pdf')
    def generate_logbook_pdf(self, request):
        def generate_logbook_page_elements(project, week, progress, tasks, project_tasks):
            # build the elements list
            elements = []

            styles = getSampleStyleSheet()
            title_style = ParagraphStyle(
                "TitleStyle",
                parent=styles["Title"],
                fontName="Times-Roman",
                fontSize=12,
                spaceAfter=1,
                alignment=TA_CENTER,
                textColor=colors.black,
            )

            agenda_style = ParagraphStyle(
                "AgendaStyle",
                parent=styles["BodyText"],
                fontName="Times-Roman",
                fontSize=12,
                leftIndent=10,
                spaceAfter=5,
            )

            points_style = ParagraphStyle(
                "PointsStyle",
                fontName="Times-Roman",
                fontSize=12,
                leftIndent=25,
                spaceAfter=5,
            )

            body_style = ParagraphStyle(
                "BodyStyle",
                parent=styles["BodyText"],
                fontName="Times-Roman",
                fontSize=12,
                leading=14,
                alignment=0,
            )

            selected_week = week.week_number
            date = progress.submitted_date.strftime('%Y-%m-%d')
            remarks = progress.remarks

            # Title
            elements.append(Paragraph("<b><u>Project Weekly Report</u></b>", title_style))
            data = [[f"Group No.: {project.group_no}", f"Week No.: {selected_week}", f"Date: {date}"]]
            table_header = Table(data, colWidths=[220, 220, 220])
            table_header.setStyle(TableStyle([
                ("ALIGN", (0, 0), (-1, -1), "CENTER"),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TEXTCOLOR", (0, 0), (-1, -1), colors.black),
                ("FONTNAME", (0, 0), (-1, -1), "Times-Roman"),
                ("FONTSIZE", (0, 0), (-1, -1), 12),
            ]))
            elements.append(table_header)
            elements.append(Spacer(1, 15))

            # Agenda
            elements.append(Paragraph("<b>Agenda:</b>", agenda_style))
            elements.append(Spacer(1, 5))
            for task in tasks:
                elements.append(Paragraph(f"• {task.task}", points_style))

            elements.append(Spacer(1, 12))

            # Progress Status
            table_data = [[Paragraph("<b>Progress Status</b>", title_style)]]
            for project_task in project_tasks:
                task_description = project_task.details if project_task.details else ""
                if task_description.strip():
                    table_data.append([Paragraph(f"{task_description}", body_style)])

            table_data.append([Paragraph(remarks, body_style)])

            # Adjust table rows
            expected_rows = 5
            if len(table_data) < expected_rows:
                for _ in range(expected_rows - len(table_data)):
                    table_data.append([Paragraph("", body_style)])

            row_heights = [25, 70, 70, 70, 70]
            table_status = Table(table_data, colWidths=[500], rowHeights=row_heights)
            table_status.setStyle(TableStyle([
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),
                ('FONTNAME', (0, 0), (-1, 0), 'Times-Bold'),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('VALIGN', (0, 0), (-1, 0), 'MIDDLE'),
                ('FONTNAME', (0, 1), (-1, -1), 'Times-Roman'),
                ('FONTSIZE', (0, 1), (-1, -1), 12),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
                ('ALIGN', (0, 1), (-1, -1), 'LEFT'),
                ('VALIGN', (0, 1), (-1, -1), 'TOP'),
                ('FONTSIZE', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 2),
                ('TOPPADDING', (0, 0), (-1, 0), 2),
                ('WORDWRAP', (0, 1), (-1, -1), True),
                ('GRID', (0, 0), (-1, -1), 1, colors.black),
            ]))
            elements.append(table_status)

            project_tasks = ProjectTask.objects.filter(project=project, task__week=week)

            team_members = [project.leader] + list(project.members.all())

            # Get guide and co-guide
            project_guide = project.project_guide
            project_co_guide = project.project_co_guide

            signature_style = ParagraphStyle(
                "SignatureStyle",
                fontName="Times-Roman",
                fontSize=12,
                leading=14,  # Line spacing
                leftIndent=10,  # Left align text
            )

            # Signature content
            # signature_text = """
            # Signature:<br/><br/>
            # Team Member 1: Prakruti Bhavsar<br/><br/>
            # Team Member 2: Akanksha bhoir<br/><br/>
            # Team Member 3: Payal Gupta<br/><br/>
            # Team Member 4: Nimisha Idekar<br/><br/>
            # Project Guide/Co-Guide Name: Prof. Vishal S. Badgujar      Prof. Seema Jadhav<br/><br/>
            # Signature:
            # """

            signature_lines = ["Signature:<br/><br/>"]

            for idx, member in enumerate(team_members, start=1):
                full_name = f"{member.user.first_name} {member.middle_name or ''} {member.user.last_name}".strip()
                signature_lines.append(f"Team Member {idx}: {full_name}<br/><br/>")

            signature_lines.append("<br/><br/>")
            if project_guide and project_co_guide:
                guide_line = f"Project Guide/Co-Guide Name: {project_guide.title} {project_guide.user.first_name} {project_guide.middle_name or ''} {project_guide.user.last_name} &nbsp;&nbsp;&nbsp;&nbsp; {project_co_guide.title} {project_co_guide.user.first_name} {project_co_guide.middle_name or ''} {project_co_guide.user.last_name}<br/><br/>"
            elif project_guide:
                guide_line = f"Project Guide/Co-Guide Name: {project_guide.title} {project_guide.user.first_name} {project_guide.middle_name or ''} {project_guide.user.last_name}<br/><br/>"
            else:
                guide_line = "Project Guide/Co-Guide Name:"  # no guide? maybe show blank?

            signature_lines.append(guide_line)

            signature_text = "\n".join(signature_lines)

            # Create paragraph for the signature section
            signature_paragraph = Paragraph(signature_text, signature_style)

            # Add to PDF elements
            elements.append(Spacer(1, 20))  # Space before signature section
            elements.append(signature_paragraph)


            return elements
        try:
            project_id = self.request.query_params.get('id', None)
            project = Project.objects.get(id=project_id)
            sem_value = None
            if project.sem.sem == "Major Project":
                sem_value = "sem_7" if request.query_params.get("sem_new") == "7" else "sem_8" 
            week_list = Week.objects.filter(semester=project.sem, sem=sem_value).order_by('week_number')

            def header(canvas, doc):
                try:
                    image_path = os.path.join(settings.BASE_DIR, 'images', 'image.png')  # Ensure correct image path
                    canvas.drawImage(image_path, 30, 750, width=530, height=80)  # Adjust dimensions as needed

                    # canvas.showPage()  # Ensure the page is properly initiated
                except Exception as e:
                    print(f"Error in header function: {e}")
            
            # Create an HTTP response with PDF content type
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = 'inline; filename="weekly_logbook.pdf"'

            # Define the PDF document
            doc = SimpleDocTemplate(response, pagesize=A4)

            frame = Frame(30, 50, 535, 690, id='normal') 

            template = PageTemplate(id='header_template', frames=frame, onPage=header)
            doc.addPageTemplates([template]) 

            elements =[]
            styles = getSampleStyleSheet()
            # ---- Front Page ----
            centered_style = ParagraphStyle(
                name="Centered",
                parent=styles["Normal"],
                alignment=TA_CENTER,
                fontSize=12,
                leading=16,
                fontName='Times-Roman'
            )

            bold_centered_style = ParagraphStyle(
                name="BoldCentered",
                parent=styles["Normal"],
                alignment=TA_CENTER,
                fontSize=13,
                leading=18,
                spaceAfter=10,
                spaceBefore=10,
                fontName='Times-Roman'
            )

            # Data (dynamic)
            project_title = project.final_topic
            team_members = [project.leader] + list(project.members.all())
            students = []
            for mem in team_members:
                students.append({
                    "name": f"{mem.user.first_name} {mem.middle_name} {mem.user.last_name}".strip(),
                    "moodle_id": mem.user.username 
                })
            project_guide = project.project_guide
            project_co_guide = project.project_co_guide

            project_coord = project.sem.project_coordinator 
            hod = Teacher.objects.filter(
                role__name="Head of Department",
                department=project.project_guide.department  # Same department as project guide
            ).first()
            
            guide_name = f"{project_guide.user.first_name} {project_guide.middle_name or ''} {project_guide.user.last_name}"
            if project_co_guide:
                co_guide_name = f"{project_co_guide.user.first_name} {project_co_guide.middle_name or ''} {project_co_guide.user.last_name}"
            project_coordinator = f"{project_coord.user.first_name} {project_coord.middle_name or ''} {project_coord.user.last_name}"
            hod_name = f"{hod.user.first_name} {hod.middle_name or ''} {hod.user.last_name}".strip() if hod else ""

            # ---- Build the page ----

            # Push content down
            elements.append(Spacer(1, 10))
            semester = ""
            if sem_value == "sem_7":
                semester = "VII"
            elif sem_value =="8":
                semester = "VIII"
            else:
                semester = project.sem.sem
            # Heading
            elements.append(Paragraph(f"<b><u>Project Semester {semester} Logbook</u></b>", bold_centered_style))
            elements.append(Spacer(1, 10))
            elements.append(Paragraph(f"<b><u>{project_title}</u></b>", bold_centered_style))
            elements.append(Spacer(1, 30))

            # Students table
            student_data = []
            for student in students:
                student_data.append([
                    Paragraph(student['name'], bold_centered_style),
                    Paragraph(student['moodle_id'], bold_centered_style)
                ])

            student_table = Table(student_data, colWidths=[200, 200])
            student_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 12),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(student_table)
            elements.append(Spacer(1, 40))

            # Guide section
            elements.append(Paragraph("Under the guidance of", bold_centered_style))
            # elements.append(Spacer(1, 10))
            elements.append(Paragraph(guide_name, bold_centered_style))
            elements.append(Spacer(1, 200))  # Big space before signatures

            # Bottom row for signatures
            bottom_data = [
                [
                    Paragraph("Signature", centered_style),
                    Paragraph("Signature", centered_style),
                    Paragraph("Signature", centered_style),
                    Paragraph("Signature", centered_style),
                ],
                [
                    Paragraph("Project Co-Guide / Guide", centered_style),
                    Paragraph("Project Co-Coordinator", centered_style),
                    Paragraph("Project Coordinator", centered_style),
                    Paragraph("Head of Department", centered_style),
                ]
            ]

            bottom_table = Table(bottom_data, colWidths=[140, 140, 120, 120])
            bottom_table.setStyle(TableStyle([
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
            ]))
            elements.append(bottom_table)

            # Next page
            elements.append(NextPageTemplate('header_template'))
            elements.append(PageBreak())
            # front_page_style = ParagraphStyle("FrontTitle", parent=styles["Title"], fontSize=12, alignment=1)  # Centered
            # elements.append(Paragraph("Project Logbook", front_page_style))
            # elements.append(Spacer(1, 30))  # Space below title

            # elements.append(Paragraph("<b>Team Members:</b>", styles["Normal"]))
            # elements.append(Paragraph("1. Student A<br/>2. Student B<br/>3. Student C<br/>4. Student D", styles["Normal"]))
            # elements.append(Spacer(1, 20))  # Add space

            # elements.append(Paragraph("<b>Project Title:</b> AI-Based Guide Allocation", styles["Normal"]))
            # elements.append(Spacer(1, 50))  # Space before moving to next page
            # elements.append(NextPageTemplate('header_template')) 
            # elements.append(PageBreak())
              # Ensure next page starts new content

            # ---- Loop for Logbook Entries ----
            # logbook_entries = [
            #     {"week": 1, "status": "Discussed project scope with guide."},
            #     {"week": 2, "status": "Finalized project requirements and documentation."},
            #     {"week": 3, "status": "Developed prototype and presented to guide."},
            # ]
            # for entry in logbook_entries: 
            #     elements.append(NextPageTemplate('header_template')) 
            #     # elements.append(PageBreak()) 
            #     elements.append(Paragraph(f"<b>Week {entry['week']}:</b>", styles["Normal"]))
            #     elements.append(Paragraph(entry["status"], styles["Normal"]))
            #     elements.append(Spacer(1, 20))  # Space between weeks
            #     elements.append(PageBreak()) 

            for week in week_list:
                tasks = Task.objects.filter(week=week)
                progress = ProjectWeekProgress.objects.filter(project=project, week=week, is_final=True, week__sem=sem_value).first()
                print(progress)
                project_tasks = ProjectTask.objects.filter(project=project, task__week=week)
                if progress:
                    elements += generate_logbook_page_elements(project, week, progress, tasks, project_tasks)
                elements.append(NextPageTemplate('header_template'))
                elements.append(PageBreak())
            doc.build(elements)

            return response
        except Exception as e:
            return HttpResponse(f"Error generating PDF: {e}", status=500)

    def generate_excel(self, request):
        try:
            # Create an in-memory output file for the workbook.
            output = BytesIO()

            # Create an Excel workbook and worksheet
            workbook = xlsxwriter.Workbook(output, {'in_memory': True})
            worksheet = workbook.add_worksheet('Guide Allocation Report')

            # Define formats
            header_format = workbook.add_format({
                'bold': True,
                'bg_color': '#D3D3D3',
                'border': 1,
                'align': 'center',
                'valign': 'vcenter'
            })

            cell_format = workbook.add_format({
                'border': 1,
                'align': 'left',
                'valign': 'vcenter'
            })

            # Define column widths
            worksheet.set_column('A:A', 10)  # Sr. No.
            worksheet.set_column('B:B', 15)  # Group Number
            worksheet.set_column('C:C', 25)  # Moodle ID
            worksheet.set_column('D:D', 40)  # Name of the Student
            worksheet.set_column('E:E', 30)  # Project Guide & Co-Guide

            # Write the header
            headers = ["Sr. No.", "Group Number", "Moodle ID", "Name of the Student", "Project Guide & Co-Guide"]
            for col_num, header in enumerate(headers):
                worksheet.write(0, col_num, header, header_format)

            # Sample data
            data = [
                [1, "A1", "21104060, 21104067, 21104050, 21104052",
                 "Siddharth Rao, Yash Deshpande, Yatish Kelriwal, Yuvraj More", "Mr. Vinay Bhave"],
                [2, "A2", "21104061, 21104063, 21104051",
                 "Shruti Jain, Sonal Shinde, Samiksha Deo", "Ms. Shankar Jadhav\nMs. Neha Kotak"],
                [3, "A3", "21104053, 21104062, 21104065",
                 "Aryan Singh, Sushant Shetty, Alok Nair", "Ms. Kiran Rao"],
                [4, "A4", "21104064, 21104066, 21104068",
                 "Raghav Mehra, Priyal Jain, Neera Nazia", "Ms. Snehal Patil"]
            ]

            # Write the data rows
            for row_num, row_data in enumerate(data, start=1):
                for col_num, cell_data in enumerate(row_data):
                    worksheet.write(row_num, col_num, cell_data, cell_format)

            # Close the workbook
            workbook.close()

            # Prepare the HTTP response
            output.seek(0)
            response = HttpResponse(
                output,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename="guide_allocation.xlsx"'
            return response
        except Exception as e:
            return HttpResponse(f"Error generating PDF: {e}", status=500)

    @action(detail=False, methods=['get'], url_path='group-excel')
    def group_excel(self, request):
        try:
            category = request.query_params.get('category', None)
            year = request.query_params.get('year', None)
            sem = request.query_params.get('sem', None)
            div = request.query_params.get('div', None)
            segment = request.query_params.get('segment', None)  # The clicked segment from frontend

            # Validate and clean input
            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

            # Get department
            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            # Get year
            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

            # Get semester
            semester = None
            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()
            print(semester)
            # Create an in-memory output file for the workbook.
            output = BytesIO()

            # Create an Excel workbook and worksheet
            workbook = xlsxwriter.Workbook(output, {'in_memory': True})
            worksheet = workbook.add_worksheet('Guide Allocation Report')

            # Define formats
            title_format = workbook.add_format({
                'bold': True,
                'font_size': 16,
                'align': 'center',
                'valign': 'vcenter'
            })

            subtitle_format = workbook.add_format({
                'bold': True,
                'font_size': 12,
                'align': 'center',
                'valign': 'vcenter'
            })

            header_format = workbook.add_format({
                'bold': True,
                # 'bg_color': '#D3D3D3',
                'border': 1,
                'align': 'center',
                'valign': 'vcenter'
            })

            cell_format = workbook.add_format({
                'border': 1,
                'align': 'left',
                'valign': 'vcenter'
            })

            merged_cell_format = workbook.add_format({
                'border': 1,
                'align': 'center',
                'valign': 'vcenter'
            })

            merged_guide_format = workbook.add_format({
                'border': 1,
                'align': 'center',
                'valign': 'vcenter',
                'text_wrap': True  # Enables multi-line text wrapping
            })

            # Insert Image (Institute Logo)
            image_path = os.path.join(settings.BASE_DIR, 'images', 'image.png')
            worksheet.insert_image('B1', image_path, {'x_scale': 1, 'y_scale': 1, 'url': '', 'align': 'center'})
            worksheet.set_row(1,40)

            if segment == "Students Allocated":
                projects = Project.objects.filter(sem=semester).order_by("div","id")
                print(projects)
                project_data = []
                # Create a mapping for divisions
                div_count = {}
                index = 1
                for project in projects:
                    if project.div not in div_count:
                        div_count[project.div] = 1  # Start numbering from 1
                    else:
                        div_count[project.div] += 1
                    
                    group_code = f"{project.div}{div_count[project.div]}"
                    
                    moodle_ids = []
                    student_names = []

                    def get_full_name(student):
                        name_parts = [student.user.first_name]
                        if student.middle_name:  # Only add middle name if it's not null
                            name_parts.append(student.middle_name)
                        name_parts.append(student.user.last_name)
                        return " ".join(name_parts)

                    if project.leader:
                        moodle_ids.append(project.leader.user.username)
                        student_names.append(get_full_name(project.leader))

                    if project.members.exists():
                        moodle_ids.extend([member.user.username for member in project.members.all()])
                        student_names.extend([get_full_name(member) for member in project.members.all()])
                    
                    teacher = []
                    if project.project_guide:
                        teacher.append(get_full_name(project.project_guide))
                    if project.project_co_guide:
                        teacher.append(get_full_name(project.project_co_guide))

                    project_data.append([index,project.group_no,moodle_ids,student_names,"\n".join(teacher)])

                    index+=1
                print(project_data)

                if semester:
                    project_coordinator = semester.project_coordinator
                    project_co_coordinator = semester.project_co_coordinator
                    class_incharge = semester.class_incharge
                
                hod = Teacher.objects.filter(department=dept, role__name="Head of Department").first()
                footer_data = [
                    (project_coordinator, "Project Co-Coordinator"),
                    (project_co_coordinator, "Project Co-ordinator"),
                    (class_incharge, "Class In-charge"),
                    (hod, "HOD")
                ]
                worksheet.merge_range('A6:E6', "Group", title_format)
                worksheet.merge_range('A7:E7', f"Academic Year: {year}", subtitle_format)

                # Define column widths
                worksheet.set_column('A:A', 6)  # Sr. No.
                worksheet.set_column('B:B', 15)  # Roll Number
                worksheet.set_column('D:D', 30)  # Moodle ID
                worksheet.set_column('E:E', 40)  # Name of the Student
                worksheet.set_column('F:F', 40)  # Project Guide & Co-Guide

                # Write the header
                headers = ["Sr. No.", "Group Number", "Moodle ID", "Name of the Student", "Project Guide & Co-Guide"]
                for col_num, header in enumerate(headers):
                    worksheet.write(8, col_num, header, header_format)  # Start header at row 9 (index 8)

                row = 9  # Start writing data from row 10
                for sr_no, group, moodle_ids, students, guide in project_data:
                    group_size = len(students)  # Number of students in this group
                    
                    # Merge Sr. No., Group Number, and Project Guide columns for the whole group
                    if group_size > 1:
                        worksheet.merge_range(row, 0, row + group_size - 1, 0, sr_no, merged_cell_format)  # Sr. No.
                        worksheet.merge_range(row, 1, row + group_size - 1, 1, group, merged_cell_format)  # Group Number
                        worksheet.merge_range(row, 4, row + group_size - 1, 4, guide, merged_guide_format)  # Project Guide # Project Guide

                    for i in range(group_size):  # Roll Number
                        worksheet.write(row, 2, moodle_ids[i], cell_format)  # Moodle ID
                        worksheet.write(row, 3, students[i], cell_format)
                        row += 1
                # Determine footer row (10 rows below the last row of the table)
                footer_row = row + 10  

                footer_format = workbook.add_format({
                    'bold': True,
                    'align': 'justify',  # Justifies the text within the merged cell
                    'valign': 'vcenter',
                    'text_wrap': True  # Enables multi-line text wrapping
                })

                worksheet.set_column('A:D', 25)

                # # Write footer text in separate columns for proper alignment
                # worksheet.write(footer_row, 0, "Mr. Sachin Kasare\n(Project Co-Coordinator)", footer_format)
                # worksheet.write(footer_row, 1, "Mr. Vishal Badgujar\n(Project Co-ordinator)", footer_format)
                # worksheet.write(footer_row, 2, "Ms. Sonal Balpande\n(Class In-charge)", footer_format)
                # worksheet.write(footer_row, 3, "Dr. Kiran Deshpande\n(HOD, Information Technology)", footer_format)
                for idx, (teacher, role) in enumerate(footer_data):
                    if teacher:
                        full_name = f"{teacher.user.first_name} {teacher.middle_name if teacher.middle_name else ''} {teacher.user.last_name}".strip()
                        worksheet.write(footer_row, idx, f"{full_name}\n({role})", footer_format)

                # Optionally, if any teacher data is missing, you can provide a default value like "Not Available"
                for idx, (teacher, role) in enumerate(footer_data):
                    if not teacher:
                        worksheet.write(footer_row, idx, f"Not Available\n({role})", footer_format)
                
                workbook.close()

                # Prepare the HTTP response
                output.seek(0)
                response = HttpResponse(
                    output,
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
                response['Content-Disposition'] = 'attachment; filename="students_allocated_groups.xlsx"'
                return response
            elif segment == "Students Remaining":
                latest_entries = CurrentSem.objects.filter(
                    id__in=CurrentSem.objects.values('student').annotate(
                        latest_id=Max('id')
                    ).values('latest_id')
                )

                if semester: 
                    relevant_entries = latest_entries.filter(sem=semester)

                    remaining_students = relevant_entries.filter(form=0)
                
                remaining_student_details = []
                index = 1
                for entry in remaining_students:
                    student = entry.student
                    full_name = f"{student.user.first_name} {student.middle_name if student.middle_name else ''} {student.user.last_name}".strip()
                    remaining_student_details.append([index,student.user.username,full_name])
                    index+=1
                
                if semester:
                    project_coordinator = semester.project_coordinator
                    project_co_coordinator = semester.project_co_coordinator
                    class_incharge = semester.class_incharge
                
                hod = Teacher.objects.filter(department=dept, role__name="Head of Department").first()
                footer_data = [
                    (project_coordinator, "Project Co-Coordinator"),
                    (project_co_coordinator, "Project Co-ordinator"),
                    (class_incharge, "Class In-charge"),
                    (hod, "HOD")
                ]

                worksheet.merge_range('A6:C6', "Group", title_format)
                worksheet.merge_range('A7:C7', f"Academic Year: {year}", subtitle_format)

                # Define column widths
                worksheet.set_column('A:A', 6)  # Sr. No.
                worksheet.set_column('B:B', 30)  # Moodle ID
                worksheet.set_column('C:C', 40)  # Name of the Student

                # Write the header
                headers = ["Sr. No.", "Moodle ID", "Name of the Student"]
                for col_num, header in enumerate(headers):
                    worksheet.write(8, col_num, header, header_format)  # Start header at row 9 (index 8)

                row = 9  # Start writing data from row 10
                for sr_no, moodle_ids, students in remaining_student_details:

                    worksheet.write(row,0,sr_no, cell_format)
                    worksheet.write(row, 1, moodle_ids, cell_format)  # Moodle ID
                    worksheet.write(row, 2, students, cell_format)
                    row += 1
                # Determine footer row (10 rows below the last row of the table)
                footer_row = row + 10  

                footer_format = workbook.add_format({
                    'bold': True,
                    'align': 'justify',  # Justifies the text within the merged cell
                    'valign': 'vcenter',
                    'text_wrap': True  # Enables multi-line text wrapping
                })

                worksheet.set_column('A:D', 25)

                # # Write footer text in separate columns for proper alignment
                # worksheet.write(footer_row, 0, "Mr. Sachin Kasare\n(Project Co-Coordinator)", footer_format)
                # worksheet.write(footer_row, 1, "Mr. Vishal Badgujar\n(Project Co-ordinator)", footer_format)
                # worksheet.write(footer_row, 2, "Ms. Sonal Balpande\n(Class In-charge)", footer_format)
                # worksheet.write(footer_row, 3, "Dr. Kiran Deshpande\n(HOD, Information Technology)", footer_format)
                for idx, (teacher, role) in enumerate(footer_data):
                    if teacher:
                        full_name = f"{teacher.user.first_name} {teacher.middle_name if teacher.middle_name else ''} {teacher.user.last_name}".strip()
                        worksheet.write(footer_row, idx, f"{full_name}\n({role})", footer_format)

                # Optionally, if any teacher data is missing, you can provide a default value like "Not Available"
                for idx, (teacher, role) in enumerate(footer_data):
                    if not teacher:
                        worksheet.write(footer_row, idx, f"Not Available\n({role})", footer_format)
                workbook.close()

                # Prepare the HTTP response
                output.seek(0)
                response = HttpResponse(
                    output,
                    content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                )
                response['Content-Disposition'] = 'attachment; filename="students_remaining.xlsx"'
                return response
        except Exception as e:
            return HttpResponse(f"Error generating Excel: {e}", status=500)

class DomainViewSet(viewsets.ModelViewSet):
    queryset = Domain.objects.all().order_by("id")  # Fetches all Domain objects
    serializer_class = DomainSerializer 

class TeacherPreferenceViewSet(viewsets.ModelViewSet):
    queryset = TeacherPreference.objects.all()
    serializer_class = TeacherPreferenceSerializer
    permission_classes = [permissions.IsAuthenticated]  # Ensure only authenticated users can access

    @action(detail=False, methods=['post'])
    def save_preferences(self, request):
        try:
            print(f"User: {request.user}, Authenticated: {request.user.is_authenticated}")
            teacher = Teacher.objects.get(user=request.user)  
        except Teacher.DoesNotExist:
            return Response({"error": "Teacher profile not found"}, status=status.HTTP_404_NOT_FOUND)
        
        preferences = request.data.get('preferences', [])  # Get preferences from request
        
        if not preferences:
            return Response({"error": "No preferences provided"}, status=status.HTTP_400_BAD_REQUEST)

        
        with transaction.atomic():  
            # Remove previous preferences for this teacher
            TeacherPreference.objects.filter(teacher=teacher).delete()

            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT setval(pg_get_serial_sequence('api_teacherpreference', 'id'), "
                    "COALESCE((SELECT MAX(id) FROM api_teacherpreference) + 1, 1), false);"
                )

            new_preferences = []
            for pref in preferences:
                domain_id = pref.get('id')
                rank = pref.get('rank')

                if not domain_id or not rank:
                    return Response({"error": "Invalid data"}, status=status.HTTP_400_BAD_REQUEST)

                try:
                    domain = Domain.objects.get(id=domain_id)  # Get domain instance
                except Domain.DoesNotExist:
                    return Response({"error": f"Domain with id {domain_id} not found"}, status=status.HTTP_400_BAD_REQUEST)

                new_preferences.append(
                    TeacherPreference(teacher=teacher, domain=domain, preference_rank=rank)
                )

            TeacherPreference.objects.bulk_create(new_preferences) 

            year = Year.objects.filter(department = teacher.department.id).order_by('-id').first()

            semester = Sem.objects.filter(year=year, sem="Major Project").first()

            cursem = ProjectGuide.objects.filter(sem=semester, teacher=teacher).first()

            if cursem:
                cursem.form = 1
                cursem.save()

        return Response({"message": "Preferences saved successfully!"}, status=status.HTTP_201_CREATED)



    @action(detail=False, methods=['get'])
    @transaction.atomic
    def get_preferences(self, request):
        try:
            # Get logged-in student
            student = Student.objects.get(user=request.user)

            student_batch = student.batch 

            sem = CurrentSem.objects.filter(student=student).order_by('-id').first()

            if sem:
                teachers = ProjectGuide.objects.filter(sem=sem.sem).values_list('teacher', flat=True).distinct()

            # Get all teachers in the student's department
            # teachers_in_department = Teacher.objects.filter(department=student_batch.department,  experience__gt=6)

            # Filter preferences based on department-specific teachers
            # preferences = TeacherPreference.objects.filter(teacher__in=teachers_in_department).select_related('teacher__user', 'domain')
            
            preferences = TeacherPreference.objects.filter(teacher__in=teachers).select_related('teacher__user', 'domain')
            teacher_dict = defaultdict(list)

            for pref in preferences:
                teacher_name = f"{pref.teacher.title} {pref.teacher.user.first_name} {pref.teacher.user.last_name}"
                teacher_dict[pref.domain.name].append(teacher_name)

            return Response(teacher_dict)

        except Student.DoesNotExist:
            return Response({"error": "Student not found"}, status=404)
    
    @action(detail=False, methods=['get'], url_path='availability')
    def get_availability(self, request):
        def get_full_name(student):
            name_parts = [student.user.first_name]
            if student.middle_name:  # Only add middle name if it's not null
                name_parts.append(student.middle_name)
            name_parts.append(student.user.last_name)
            return " ".join(name_parts)

        try:
            category = request.query_params.get("category") 
            year = request.query_params.get("year") 
            sem = request.query_params.get("sem")  # Selected Semester ID
            div = request.query_params.get("div")

            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            # Step 2: Get the year
            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

            # Step 4: Get the semester safely
            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()

            if not semester:
                return Response(
                    {"error": f"Semester '{sem}' with Division '{div}' not found for year '{year}'"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            domain_teacher_data = []
            all_teachers_in_domain = []
            co_guides = []
            if sem == "Major Project":
                domains = Domain.objects.all()

                for domain in domains:
                    # Get the teacher preferences for each domain
                    teacher_preferences = TeacherPreference.objects.filter(domain=domain)
                    teachers_with_availability = []

                    for preference in teacher_preferences:
                        teacher = preference.teacher
                        all_teachers_in_domain.append(teacher)
                        # Fetch the project guide for this teacher
                        project_guide = ProjectGuide.objects.filter(teacher=teacher, sem=semester).first()
                        if project_guide:
                            teachers_with_availability.append({
                                'teacher_name': get_full_name(teacher),
                                'teacher_id': teacher.user.id,
                                'availability': project_guide.availability
                            })
                        else:
                            co_guides.append({
                                'teacher_name': get_full_name(teacher),
                                'teacher_id': teacher.user.id,
                            })
                    # guide_teacher_ids = [t['teacher_id'] for t in teachers_with_availability]
                    # co_guides = [
                    #     {
                    #         'teacher_name': get_full_name(teacher),
                    #         'teacher_id': teacher.user.id,
                    #     }
                    #     for teacher in all_teachers_in_domain
                    #     if teacher.user.id not in guide_teacher_ids
                    # ]
                    domain_teacher_data.append({
                        'domain_name': domain.name,
                        'domain_id': domain.id,
                        'teachers': teachers_with_availability,
                        'co_guides': co_guides,
                    })
            else:
                projectguide = ProjectGuide.objects.filter(sem=semester)

                for pg in projectguide:
                    domain_teacher_data.append({
                        'teacher_name': get_full_name(pg.teacher),
                        'teacher_id': pg.teacher.user.id,
                        'availability': pg.availability
                    })
            return Response(domain_teacher_data, status=status.HTTP_200_OK)
        except Exception as e:
                print("ERROR:", str(e))
                print(traceback.format_exc())  # Prints full error traceback
                return Response({"error": f"Registration failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
        

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    permission_classes=[permissions.IsAuthenticated]
    parser_classes = (MultiPartParser, FormParser, JSONParser)  # Allows file uploads
    
    @action(detail=False, methods=['post'])
    def register(self, request):
        print("Request received:", request.method, request.path)
        print("Request headers:", request.headers)
        print("Request data:", request.data)  # Log request data
        print("Request FILES:", request.FILES)  # Log uploaded files

        file = request.FILES.get("file", None)  # Get file safely

        if file:
            print("File received:", file.name)
            return self._handle_csv_upload(file)
        else:
            print("not file found")
            data = request.data
            username = data.get("moodleId")  
            first_name = data.get("firstname")
            last_name = data.get("lastname")
            email = data.get("email")
            batch_id = data.get("batch")  
            department = data.get("department")
            middle_name = data.get("middlename")

            if not all([username, first_name, last_name, email, batch_id]):
                return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

            if User.objects.filter(username=username).exists():
                print("exists")
                return Response({"error": "User already exists"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                with transaction.atomic():
                    password = f"{username}@Apsit"
                    user = User.objects.create_user(username=username, email=email, password=password)
                    user.first_name = first_name
                    user.last_name = last_name
                    user.save()

                    try:
                        dept = Department.objects.get(name=department)
                        batch = Batch.objects.get(batch=batch_id, department=dept)
                    except Batch.DoesNotExist:
                        raise ValueError("Invalid batch ID")  # Causes rollback
                    except Department.DoesNotExist:
                        raise ValueError("Invalid department")  # Causes rollback

                    student = Student.objects.create(user=user, batch=batch, middle_name=middle_name)
                    student.save()

                return Response({"message": "Student registered successfully!"}, status=status.HTTP_201_CREATED)

            except ValueError as ve:
                return Response({"error": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                print("ERROR:", str(e))
                print(traceback.format_exc())  # Prints full error traceback
                return Response({"error": f"Registration failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _handle_csv_upload(self, file):
        
        try:
            if file.name.endswith(".csv"):
                df = pd.read_csv(file)
            elif file.name.endswith(".xlsx"):
                df = pd.read_excel(file)
            else:
                return Response({"error": "Invalid file format. Use CSV or Excel."}, status=status.HTTP_400_BAD_REQUEST)

            print(df.columns)
            required_columns = {"moodleId", "firstname", "lastname", "batch", "email", "middlename", "department"}
            missing_columns = required_columns - set(df.columns)

            if missing_columns:
                return Response({"error": f"Missing required columns: {missing_columns}"}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                for _, row in df.iterrows():
                    username = row["moodleId"]

                    if User.objects.filter(username=username).exists():
                        continue  # Skip existing users
                    password = f'{username}@Apsit'
                    user = User.objects.create_user(username=username, email=row["email"], password=password)
                    user.first_name = row["firstname"]
                    user.last_name = row["lastname"]
                    user.save()

                    try:
                        dept = Department.objects.get(name=row["department"])
                        batch = Batch.objects.get(batch=row["batch"], department=dept)
                    except Batch.DoesNotExist:
                        raise ValueError(f"Invalid batch ID: {row['batch']}")  # Forces rollback
                    except Department.DoesNotExist:
                        raise ValueError(f"Invalid department: {row['department']}")  # Forces rollback

                    Student.objects.create(user=user, batch=batch, middle_name=row["middlename"])

            return Response({"message": "CSV file processed successfully!"}, status=status.HTTP_201_CREATED)

        except ValueError as ie:
            return Response({"error": str(ie)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": f"Processing failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=["post"], url_path="register-sem-wise")    
    @transaction.atomic
    def register_students_in_sem(self, request):
        try:
            category = request.data.get("category") 
            year = request.data.get("year") 
            sem = request.data.get("sem")  # Selected Semester ID
            div = request.data.get("div")
            students = request.data.get("students")
            print(students)

            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            # Step 2: Get the year
            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

            # Step 4: Get the semester safely
            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()

            if not semester:
                return Response(
                    {"error": f"Semester '{sem}' with Division '{div}' not found for year '{year}'"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT setval(pg_get_serial_sequence('currentsem', 'id'), "
                    "COALESCE((SELECT MAX(id) FROM currentsem) + 1, 1), false);"
                )
            
            success_list = []
            already_exists = []
            errors = []

            for std in students:
                try:
                    student = Student.objects.get(user__username=std)
                    current_sem, created = CurrentSem.objects.get_or_create(
                        student=student,
                        sem=semester,
                        defaults={"form": 0}
                    )

                    if created:
                        success_list.append(std)
                    else:
                        already_exists.append(std)
                except Student.DoesNotExist:
                    errors.append(f"Student '{std}' not found")

            # Build the response message
            response_data = {
                "success": f"{len(success_list)} students registered successfully." if success_list else None,
                "already_exists": f"{len(already_exists)} students were already registered." if already_exists else None,
                "errors": errors if errors else None
            }

            return Response(response_data, status=200)
        except Exception as e:
            return Response({"error": f"Processing failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=["post"], url_path="upload-student-file")
    @transaction.atomic
    def upload_student_file(self, request):
        try:
            # Step 1: Check if a file is uploaded
            if 'file' not in request.FILES:
                return Response({"error": "No file uploaded."}, status=status.HTTP_400_BAD_REQUEST)

            file = request.FILES['file']

            # Step 2: Parse the uploaded file
            if file.name.endswith('.csv'):
                file_data = pd.read_csv(file)
            elif file.name.endswith(('.xls', '.xlsx')):
                file_data = pd.read_excel(file)
            else:
                return Response({"error": "Invalid file format. Please upload a CSV or Excel file."}, status=status.HTTP_400_BAD_REQUEST)

            # Step 3: Validate the columns
            required_columns = ["moodleId", "firstname", "lastname", "middlename"]
            missing_columns = [col for col in required_columns if col not in file_data.columns]
            if missing_columns:
                return Response({"error": f"Missing required columns: {', '.join(missing_columns)}"}, status=status.HTTP_400_BAD_REQUEST)

            # Step 4: Extract the students' Moodle IDs
            students = file_data.to_dict(orient="records") 

            # Step 5: Extract category, year, and semester from the request
            category = request.data.get("category")
            year = request.data.get("year")
            sem = request.data.get("sem")
            div = request.data.get("div")

            # Step 6: Handle semester and division
            sem = None if not sem or sem.lower() == "null" else sem.strip()
            div = None if not div or div.lower() == "null" or div.lower() == "undefined" else div.strip()

            # Step 7: Fetch the department
            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            # Step 8: Fetch the year
            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

            # Step 9: Fetch the semester
            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()

            if not semester:
                return Response(
                    {"error": f"Semester '{sem}' with Division '{div}' not found for year '{year}'"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Step 10: Set the serial sequence for current semester registration
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT setval(pg_get_serial_sequence('currentsem', 'id'), "
                    "COALESCE((SELECT MAX(id) FROM currentsem) + 1, 1), false);"
                )

            success_list = []
            already_exists = []
            name_mismatch = []
            errors = []
            # Step 11: Register students
            for std in students:
                try:
                    moodle_id = str(std["moodleId"]).strip()
                    student = Student.objects.get(user__username=moodle_id)

                    # Checking names
                    expected_first = student.user.first_name.strip().lower()
                    expected_last = student.user.last_name.strip().lower()
                    expected_middle = (student.middle_name or "").strip().lower()

                    file_first = str(std["firstname"]).strip().lower()
                    file_last = str(std["lastname"]).strip().lower()
                    file_middle = str(std.get("middlename", "")).strip().lower()

                    if not (expected_first == file_first and expected_last == file_last and expected_middle == file_middle):
                        name_mismatch.append(moodle_id)

                    # Register student
                    current_sem, created = CurrentSem.objects.get_or_create(
                        student=student,
                        sem=semester,
                        defaults={"form": 0}
                    )

                    if created:
                        success_list.append(moodle_id)
                    else:
                        already_exists.append(moodle_id)

                except Student.DoesNotExist:
                    errors.append(f"Student '{std['moodleId']}' not found")

            # Step 12: Build and return the response message
            response_data = {
                "success": f"{len(success_list)} students registered successfully." if success_list else None,
                "already_exists": f"{len(already_exists)} students were already registered." if already_exists else None,
                "name_mismatch": name_mismatch if name_mismatch else None,
                "errors": errors if errors else None
            }

            return Response(response_data, status=200)

        except Exception as e:
            return Response({"error": f"An error occurred while processing the file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
class StudentSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated] 

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        student = self.get_object()
        data = request.data.copy()

        # Update User fields
        user = student.user
        user.username = data.get('moodleid', user.username)
        user.first_name = data.get('first_name', user.first_name)
        user.last_name = data.get('last_name', user.last_name)
        user.email = data.get('email', user.email)
        user.save()

        # Update middle name if provided
        middle_name = data.get('middle_name')
        if middle_name is not None:
            student.middle_name = middle_name

        # Update Batch and Department if provided
        department_name = data.get('department')
        batch_name = data.get('batch')
        if department_name and batch_name:
            try:
                department = Department.objects.get(name=department_name)
                batch = Batch.objects.get(batch=batch_name, department=department)
                student.batch = batch
            except (Department.DoesNotExist, Batch.DoesNotExist):
                return Response({'detail': 'Invalid batch or department name.'}, status=status.HTTP_400_BAD_REQUEST)

        student.save()
        return Response({"message":"Student data updated"}, status=200)

    @action(detail=False, methods=["get"], url_path="by-batch")
    def get_students_by_batch(self, request, batch_id=None):
        category = request.query_params.get('category', None)
        year = request.query_params.get('year', None)
        sem = request.query_params.get('sem', None)
        div = request.query_params.get('div', None)
        batch = request.query_params.get('batch', None)

        sem = None if (not sem or sem.lower() == "null") else sem.strip()
        div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

        dept = Department.objects.filter(name__iexact=category).first()
        if not dept:
            return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

        # Step 2: Get the year
        y = Year.objects.filter(department=dept, year=year).first()
        if not y:
            return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

        # Step 4: Get the semester safely
        if div is not None:
            semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
        else:
            semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()

        if not semester:
            return Response(
                {"error": f"Semester '{sem}' with Division '{div}' not found for year '{year}'"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        
        students = Student.objects.filter(batch_id=batch).exclude(
            user_id__in=CurrentSem.objects.filter(sem=semester).values_list("student_id", flat=True)
        )

        serializer = self.get_serializer(students, many=True)
        return Response(serializer.data)


class BatchViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer
    permission_classes = [permissions.IsAuthenticated] 

    @action(detail=False, methods=["get"], url_path="by-department")
    def get_batches_by_department(self, request,):
        category = request.query_params.get('category', None)
        batch = Batch.objects.filter(department__name=category)

        serializer = BatchSerializer(batch, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer
    permission_classes = [permissions.IsAuthenticated]

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        teacher = self.get_object()
        data = request.data.copy()

        # Update User fields
        user = teacher.user
        user.username = data.get("moodleid", user.username)
        user.first_name = data.get("firstname", user.first_name)
        user.last_name = data.get("lastname", user.last_name)
        user.email = data.get("email", user.email)
        user.save()

        # Update teacher middle name
        middle_name = data.get("middlename")
        if middle_name is not None:
            teacher.middle_name = middle_name

        # Update Department
        dept_name = data.get("department")
        if dept_name:
            try:
                department = Department.objects.get(name=dept_name)
                teacher.department = department
            except Department.DoesNotExist:
                return Response({"detail": "Invalid department name."}, status=status.HTTP_400_BAD_REQUEST)

        # Update Designation (Role)
        role_name = data.get("designation")
        if role_name:
            try:
                designation = Designation.objects.get(name=role_name)
                teacher.role = designation
            except Designation.DoesNotExist:
                return Response({"detail": "Invalid designation."}, status=status.HTTP_400_BAD_REQUEST)

        teacher.save()

        serializer = self.get_serializer(teacher)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="by-department/(?P<department_name>[^/.]+)")
    def get_teachers_by_department(self, request, department_name=None):
        teachers = Teacher.objects.filter(department__name=department_name)

        if not teachers.exists():
            return Response({"error": "No teachers found in this department"}, status=status.HTTP_404_NOT_FOUND)

        serializer = TeacherSerializer(teachers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path="roles")
    def get_roles(self, request):
        user = request.user
        category = request.query_params.get('category', None)
        year = request.query_params.get('year', None)
        sem = request.query_params.get('sem', None)
        div = request.query_params.get('div', None)

        sem = None if (not sem or sem.lower() == "null") else sem.strip()
        div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

        dept = Department.objects.filter(name__iexact=category).first()
        if not dept:
            return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

        # Step 2: Get the year
        y = Year.objects.filter(department=dept, year=year).first()
        if not y:
            return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

        # Step 3: Debug available semesters
        available_sems = Sem.objects.filter(year=y).values("sem", "div")
        print(f"Available Sems for Year {year}: {list(available_sems)}")

        # Step 4: Get the semester safely
        if div is not None:
            semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
        else:
            semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()

        if not semester:
            return Response(
                {"error": f"Semester '{sem}' with Division '{div}' not found for year '{year}'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        teacher = Teacher.objects.get(user=user)

        academic_role = teacher.role.name if teacher.role else None

        project_roles = []
        if semester.project_coordinator==teacher:
            project_roles.append("Project Coordinator")
        if semester.project_co_coordinator==teacher:
            project_roles.append("Project Co-Coordinator")

        return Response({
            "academic_role": academic_role,
            "project_roles": project_roles
        })
    
    @action(detail=False, methods=["get"], url_path="visibility")
    @transaction.atomic
    def logbook_visibility(self, request):
        try:
            id = request.query_params.get('id',None)
            teacher = Teacher.objects.get(user=request.user) 

            project = Project.objects.get(pk=id)

            visibility = False
            if project.project_guide  == teacher:
                visibility = True
            if project.project_co_guide == teacher:
                visibility = True
            print(visibility)
            return Response(visibility,status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
    @action(detail=False, methods=['post'], url_path="sem-register")
    @transaction.atomic
    def register_teacher_sem(self, request):
        try:
            category = request.data.get("category") 
            year = request.data.get("year") 
            sem = request.data.get("sem")  # Selected Semester ID
            div = request.data.get("div")
            selected_teachers = request.data.get("teachers", [])  # {teacher_id: availability}
            print(selected_teachers)
            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

            dept = Department.objects.filter(name=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            # Step 2: Get the year
            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)
        
            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()
            
            if not semester:
                return Response(
                    {"error": f"Semester '{sem}' with Division '{div}' not found for year '{year}'"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            for teacher_data in selected_teachers:
                teacher_id = teacher_data.get("id")
                availability_raw = teacher_data.get("availability", 0)
                user = User.objects.filter(username = teacher_id).first()
                teacher = Teacher.objects.filter(user=user).first()
                ProjectGuide.objects.update_or_create(
                    sem=semester, teacher=teacher, defaults={"availability": availability_raw, "max_groups":availability_raw}
                )
            print("Returning SUCCESS response ✅")
            return Response({"message": f"Teachers registered successfully"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            print("Backend Error:", str(e))
            return Response({"error": str(e)}, status=500)

    @action(detail=False, methods=['get'], url_path="teacher-list")
    def get_teacher_list(self, request):
        try:
            student = Student.objects.get(user=request.user) 
            cursem = CurrentSem.objects.filter(student=student).order_by("-id").first()
            teachers=[]
            if cursem:
                semester = cursem.sem
                project_guides = ProjectGuide.objects.filter(sem=semester).select_related('teacher')
                teachers = [project_guide.teacher for project_guide in project_guides]
                serialized_teachers = TeacherSerializer(teachers, many=True)

                return Response({"teachers": serialized_teachers.data}, status=status.HTTP_200_OK)

            return Response({"error": "No current semester found"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    
    @action(detail=False, methods=["get"], url_path="teachers-pending")
    def get_available_teachers_sem(self, request):
        category = request.query_params.get('category', None)
        year = request.query_params.get('year', None)
        sem = request.query_params.get('sem', None)
        div = request.query_params.get('div', None)

        sem = None if (not sem or sem.lower() == "null") else sem.strip()
        div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

        dept = Department.objects.filter(name__iexact=category).first()
        if not dept:
            return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

        # Step 2: Get the year
        y = Year.objects.filter(department=dept, year=year).first()
        if not y:
            return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

        # Step 4: Get the semester safely
        if div is not None:
            semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
        else:
            semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()

        if not semester:
            return Response(
                {"error": f"Semester '{sem}' with Division '{div}' not found for year '{year}'"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        teachers = Teacher.objects.filter(department__name=category)
        assigned_teachers = ProjectGuide.objects.filter(sem = semester).values_list("teacher", flat=True)

        available_teachers = teachers.exclude(user__in=assigned_teachers)

        serializer = TeacherSerializer(available_teachers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @action(detail=False, methods=["post"], url_path="teacher-registration")
    def teacher_registration(self,request):
        print("Request received:", request.method, request.path)
        print("Request headers:", request.headers)
        print("Request data:", request.data)  # Log request data
        print("Request FILES:", request.FILES)  # Log uploaded files

        file = request.FILES.get("file", None)  # Get file safely

        if file:
            print("File received:", file.name)
            return self._handle_csv_upload(file)
        else:
            print("not file found")
            data = request.data
            print(data)
            username = data.get("userId")  
            first_name = data.get("firstname")
            last_name = data.get("lastname")
            email = data.get("email")
            designation = data.get("designation")  
            department = data.get("department")
            middle_name = data.get("middlename")

            if not all([username, first_name, last_name, email, designation, department, middle_name]):
                return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

            if User.objects.filter(username=username).exists():
                print("exists")
                return Response({"error": "User already exists"}, status=status.HTTP_400_BAD_REQUEST)

            # user = User.objects.create_user(username=username, email=email, password="Apsit@1234")
            # user.first_name = first_name
            # user.last_name = last_name
            # user.save()

            # try:
            #     dept = Department.objects.get(name=department)
            #     batch = Batch.objects.get(batch=batch_id, department=dept)
            # except Batch.DoesNotExist:
            #     return Response({"error": "Invalid batch ID"}, status=status.HTTP_400_BAD_REQUEST)

            # student = Student.objects.create(user=user, batch=batch, middle_name=middle_name)
            # student.save()

            # return Response({"message": "Student registered successfully!"}, status=status.HTTP_201_CREATED)

            try:
                with transaction.atomic():
                    password = f"{username}@Apsit"
                    user = User.objects.create_user(username=username, email=email, password=password)
                    user.first_name = first_name
                    user.last_name = last_name
                    user.save()

                    try:
                        dept = Department.objects.get(name=department)
                        desg = Designation.objects.get(name=designation)
                    except Batch.DoesNotExist:
                        raise ValueError("Invalid batch ID")  # Causes rollback
                    except Department.DoesNotExist:
                        raise ValueError("Invalid department")  # Causes rollback

                    teacher = Teacher.objects.create(user=user, role=desg, middle_name=middle_name, department=dept)
                    teacher.save()

                return Response({"message": "Teacher registered successfully!"}, status=status.HTTP_201_CREATED)

            except ValueError as ve:
                return Response({"error": str(ve)}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                print("ERROR:", str(e))
                print(traceback.format_exc())  # Prints full error traceback
                return Response({"error": f"Registration failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def _handle_csv_upload(self, file):
        # try:
        #     if file.name.endswith(".csv"):
        #         df = pd.read_csv(file)
        #     elif file.name.endswith(".xlsx"):
        #         df = pd.read_excel(file)
        #     else:
        #         return Response({"error": "Invalid file format. Use CSV or Excel."}, status=status.HTTP_400_BAD_REQUEST)

        #     required_columns = {"moodleId", "firstname", "lastname","batch", "email", "phone", "middleName", "department"}
        #     if not required_columns.issubset(df.columns):
        #         return Response({"error": f"Missing required columns: {required_columns}"}, status=status.HTTP_400_BAD_REQUEST)

        #     for _, row in df.iterrows():
        #         username = row["moodleId"]
        #         if User.objects.filter(username=username).exists():
        #             continue  # Skip existing users

        #         user = User.objects.create_user(username=username, email=row["email"], password="default123")
        #         user.first_name = row["firstname"]
        #         user.last_name = row["lastname"]
        #         user.save()

        #         try:
        #             dept = Department.objects.get(name=row["department"])
        #             batch = Batch.objects.get(name=row["batch"], department=dept)
        #         except Batch.DoesNotExist:
        #             continue  # Skip if batch ID is invalid

        #         Student.objects.create(user=user, batch=batch, middle_name=row["middlename"])

        #     return Response({"message": "CSV file processed successfully!"}, status=status.HTTP_201_CREATED)

        # except Exception as e:
        #     return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        try:
            if file.name.endswith(".csv"):
                df = pd.read_csv(file)
            elif file.name.endswith(".xlsx"):
                df = pd.read_excel(file)
            else:
                return Response({"error": "Invalid file format. Use CSV or Excel."}, status=status.HTTP_400_BAD_REQUEST)

            print(df.columns)
            required_columns = {"moodleId", "firstname", "lastname", "designation", "email", "middlename", "department"}
            missing_columns = required_columns - set(df.columns)

            if missing_columns:
                return Response({"error": f"Missing required columns: {missing_columns}"}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                for _, row in df.iterrows():
                    username = row["moodleId"]

                    if User.objects.filter(username=username).exists():
                        continue  # Skip existing users
                    password = f"{username}@Apsit"
                    user = User.objects.create_user(username=username, email=row["email"], password=password)
                    user.first_name = row["firstname"]
                    user.last_name = row["lastname"]
                    user.save()

                    try:
                        dept = Department.objects.get(name=row["department"])
                        desg = Designation.objects.get(name=row["designation"])
                    except Designation.DoesNotExist:
                        raise ValueError(f"Invalid batch ID: {row['designation']}")  # Forces rollback
                    except Department.DoesNotExist:
                        raise ValueError(f"Invalid department: {row['department']}")  # Forces rollback

                    Teacher.objects.create(user=user, role=desg, middle_name=row["middlename"], department=dept)

            return Response({"message": "CSV file processed successfully!"}, status=status.HTTP_201_CREATED)

        except ValueError as ie:
            return Response({"error": str(ie)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": f"Processing failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=["get"], url_path="get-teacher")
    def get_teacher(self, request):
        teachers = Teacher.objects.all()

        if not teachers.exists():
            return Response({"error": "No teachers found in this department"}, status=status.HTTP_404_NOT_FOUND)

        serializer = TeacherSerializer(teachers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class YearViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Year.objects.all()
    serializer_class = YearSerializer

    @action(detail=False, methods=["get"], url_path="grouped-by-department")
    def grouped_by_department(self, request):
        departments = Department.objects.all()
        data = {}

        for department in departments:
            years = Year.objects.filter(department=department).values_list("year", flat=True)
            data[department.name] = list(years)  # Convert QuerySet to a list

        return Response(data)

    @action(detail=False, methods=["get"], url_path="by-department")
    def by_department(self, request):
        departments = Department.objects.all()
        data = {}

        for department in departments:
            years = Year.objects.filter(department=department).values("id", "year").order_by("-id")
            data[department.name] = list(years)
        return Response(data)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        department_name = request.data.get('department_name')
        year_value = request.data.get('year')

        if not department_name or not year_value:
            return Response({"error": "Both department_name and year are required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            department = Department.objects.get(name=department_name)
        except Department.DoesNotExist:
            return Response({"error": "Department not found."}, status=status.HTTP_400_BAD_REQUEST)

        if Year.objects.filter(department=department, year=year_value).exists():
            return Response({"error": "This academic year already exists for the department."}, status=status.HTTP_400_BAD_REQUEST)
        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT setval(pg_get_serial_sequence('\"Academic Year\"', 'id'), 
                COALESCE((SELECT MAX(id) FROM "Academic Year") + 1, 1), false);
                """
            )
        year = Year.objects.create(department=department, year=year_value)

        return Response({"message":"Successfully Saved"}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['delete'])
    @transaction.atomic
    def delete_selected(self, request):
        rows_to_delete = request.data.get('ids', [])

        if not rows_to_delete:
            return Response({"error": "No data provided for deletion."}, status=status.HTTP_400_BAD_REQUEST)

        deleted_count = 0

        for row in rows_to_delete:
            department_name = row.get('department')
            year_value = row.get('year')

            if not department_name or not year_value:
                continue  # Skip this entry if department or year is missing
            
            try:
                department = Department.objects.get(name=department_name)
                year = Year.objects.get(department=department, year=year_value)
                year.delete()
                deleted_count += 1
            except (Department.DoesNotExist, Year.DoesNotExist):
                continue  # Skip if department or year is not found

        if deleted_count > 0:
            return Response({"success": f"{deleted_count} record(s) deleted successfully."}, status=status.HTTP_200_OK)
        else:
            return Response({"error": "No records were deleted."}, status=status.HTTP_404_NOT_FOUND)

class SemViewSet(viewsets.ModelViewSet):
    queryset = Sem.objects.all()
    serializer_class = SemSerializer

    def list(self, request):
        category = request.query_params.get('category', None)
        year = request.query_params.get('year', None)

        if category and year:
            dept = Department.objects.get(name = category)
            y = Year.objects.get(department=dept, year = year)
            semesters = Sem.objects.filter(year=y)
        else:
            semesters = Sem.objects.all()  # Return all if no filter is provided

        serializer = self.get_serializer(semesters, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=["post"], url_path="add-semester")
    @transaction.atomic
    def add_semester(self, request):
        data = request.data

        category = request.query_params.get('category', None)
        year = request.query_params.get('year', None)

        if category and year:
            dept = Department.objects.get(name = category)
            y = Year.objects.get(department=dept, year = year)
        print(data)
        # required_fields = ["semester", "division", "projectCoordinator", "projectCocoordinator", "classInCharge"]
        # for field in required_fields:
        #     if field not in data:
        #         return Response({field: "This field is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            project_coordinator = Teacher.objects.get(user__username=data["projectCoordinator"])
            project_co_coordinator = Teacher.objects.get(user__username=data["projectCocoordinator"])
            class_incharge = Teacher.objects.get(user__username=data["classInCharge"])
        except Teacher.DoesNotExist:
            return Response({"error": "Invalid Teacher name provided."}, status=status.HTTP_400_BAD_REQUEST)

        with connection.cursor() as cursor:
            cursor.execute(
                """
                SELECT setval(pg_get_serial_sequence('sem', 'id'), 
                COALESCE((SELECT MAX(id) FROM sem) + 1, 1), false);
                """
            )
        semester = Sem.objects.create(
            sem=data["semester"],
            year=y,
            div=data["division"],
            project_coordinator=project_coordinator,
            project_co_coordinator=project_co_coordinator,
            class_incharge=class_incharge,
            tech=data["tech"],
        )

        if semester.sem != "Major Project":
            semester.teacher_form = 1
            semester.save()

        serializer = self.get_serializer(semester)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['put'], url_path='edit-semester')
    @transaction.atomic 
    def edit_semester(self, request, pk=None):
        try:
            semester = self.get_object()
            
            data = request.data

            try:
                project_coordinator = Teacher.objects.get(user__username=data["projectCoordinator"])
                project_co_coordinator = Teacher.objects.get(user__username=data["projectCocoordinator"])
                class_incharge = Teacher.objects.get(user__username=data["classInCharge"])
            except Teacher.DoesNotExist:
                return Response({"error": "Invalid Teacher name provided."}, status=status.HTTP_400_BAD_REQUEST)
            
            semester.sem=data["semester"]
            semester.div=data["division"]
            semester.project_coordinator=project_coordinator
            semester.project_co_coordinator=project_co_coordinator
            semester.class_incharge=class_incharge
            semester.tech=data["tech"]
            semester.save()

            return Response({"message":"Sucessfully Registered"}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=False, methods=['post'], url_path='delete-semesters')
    @transaction.atomic
    def delete_semesters(self, request):
        ids_to_delete = request.data.get("ids", [])
        if not ids_to_delete:
            return Response({"error": "No semesters specified to delete"}, status=status.HTTP_400_BAD_REQUEST)

        # Delete semesters
        Sem.objects.filter(id__in=ids_to_delete).delete()

        return Response({"message": "Semesters successfully deleted"}, status=status.HTTP_200_OK)
    
    @action(detail=False, methods=["patch"], url_path="active-teacher-form")
    @transaction.atomic
    def teacher_form(self, request):
        try: 
            category = request.query_params.get('category', None)
            year = request.query_params.get('year', None)
            sem = request.query_params.get('sem', None)
            div = request.query_params.get('div', None)

            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            # Step 2: Get the year
            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

            # Step 4: Get the semester safely
            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()
            
            if semester:
                semester.teacher_form = 1
                semester.save()
            return Response({"message": "Activated Form"}, status=status.HTTP_200_OK)
        except Sem.DoesNotExist:
            return Response({"error": "Invalid semester ID"}, status=status.HTTP_400_BAD_REQUEST)
        except Teacher.DoesNotExist:
            return Response({"error": "Invalid teacher ID"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
    @action(detail=False, methods=["patch"], url_path="active-student-form")
    @transaction.atomic
    def student_form(self, request):
        try: 
            category = request.query_params.get('category', None)
            year = request.query_params.get('year', None)
            sem = request.query_params.get('sem', None)
            div = request.query_params.get('div', None)
            print(category)
            print(year)
            print(sem)
            print(div)

            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            # Step 2: Get the year
            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

            # Step 4: Get the semester safely
            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()

            print(semester)
            if semester:
                semester.student_form = 1
                semester.save()
            return Response({"message": "Activated Form"}, status=status.HTTP_200_OK)
        except Sem.DoesNotExist:
            return Response({"error": "Invalid semester ID"}, status=status.HTTP_400_BAD_REQUEST)
        except Teacher.DoesNotExist:
            return Response({"error": "Invalid teacher ID"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
    @action(detail=False, methods=["get"], url_path="form-status")
    def form_status(self, request):
        try: 
            category = request.query_params.get('category', None)
            year = request.query_params.get('year', None)
            sem = request.query_params.get('sem', None)
            div = request.query_params.get('div', None)

            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            # Step 2: Get the year
            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

            # Step 4: Get the semester safely
            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()
            
            isStudentActive = False
            isTeacherActive = False
            if semester:
                if semester.student_form == 1:
                    isStudentActive = True
                if semester.teacher_form == 1:
                    isTeacherActive = True

            return Response({
            "isStudentActive": isStudentActive,
            "isTeacherActive": isTeacherActive
        }, status=status.HTTP_200_OK)
        except Sem.DoesNotExist:
            return Response({"error": "Invalid semester ID"}, status=status.HTTP_400_BAD_REQUEST)
        except Teacher.DoesNotExist:
            return Response({"error": "Invalid teacher ID"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
    @action(detail=False, methods=["get"], url_path="teacher-form-visibility")
    def teacher_form_visibility(self, request):
        try:
            teacher = Teacher.objects.get(user=request.user) 

            year = Year.objects.filter(department = teacher.department.id).order_by('-id').first()

            semester = Sem.objects.filter(year=year, sem="Major Project").first()

            cursem = ProjectGuide.objects.get(sem=semester,teacher=teacher)

            visibility = False
            if cursem:
                if semester.teacher_form == 1 and cursem.form == 0 :
                    visibility = True
            print(visibility)
            return Response({"status":visibility},status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
    @action(detail=False, methods=["get"], url_path="group-status")
    def group_status(self, request):
        try:
            category = request.query_params.get('category', None)
            year = request.query_params.get('year', None)
            sem = request.query_params.get('sem', None)
            div = request.query_params.get('div', None)

            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            # Step 2: Get the year
            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

            # Step 4: Get the semester safely
            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()
            print(semester)
            
            latest_entries = CurrentSem.objects.filter(
                id__in=CurrentSem.objects.values('student').annotate(
                    latest_id=Max('id')
                ).values('latest_id')
            )
            allocated = 0
            remaining = 0
            if semester: 
                relevant_entries = latest_entries.filter(sem=semester)

                allocated = relevant_entries.filter(form=1).count()
                remaining = relevant_entries.filter(form=0).count()

            data = [
                { "name": "Students Allocated", "value": allocated },
                { "name": "Students Remaining", "value": remaining }
            ]

            return Response(data, status=200)

        except Sem.DoesNotExist:
            return Response({ "error": "Semester not found" }, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
    @action(detail=False, methods=["get"], url_path="publication-status")
    def publication_stats(self, request):
        try:
            category = request.query_params.get('category', None)
            year = request.query_params.get('year', None)
            sem = request.query_params.get('sem', None)
            div = request.query_params.get('div', None)

            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            # Step 2: Get the year
            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

            # Step 4: Get the semester safely
            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()
            print(semester)
            
            if semester:
                projects = Project.objects.filter(sem=semester)  # Filter by semester and division

                # Get the publication count for each division
                div_pub_count = {}
                for project in projects:
                    publication_count = Publication.objects.filter(project=project).count()
                    if project.div in div_pub_count:
                        div_pub_count[project.div] += publication_count
                    else:
                        div_pub_count[project.div] = publication_count

                # Prepare the data in the desired format
                data = [{"name": div, "value": count} for div, count in div_pub_count.items()]
                print(data)
                return Response(data, status=200)
            else:
                return Response({"error": "Semester or Division not found"}, status=status.HTTP_404_NOT_FOUND)

        except Sem.DoesNotExist:
            return Response({ "error": "Semester not found" }, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
    @action(detail=False, methods=["get"], url_path="copyright-patent-status")
    def copyright_patent_stats(self, request):
        try:
            category = request.query_params.get('category', None)
            year = request.query_params.get('year', None)
            sem = request.query_params.get('sem', None)
            div = request.query_params.get('div', None)

            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            # Step 2: Get the year
            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

            # Step 4: Get the semester safely
            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()
            print(semester)
            
            if semester:
                # Retrieve patents and copyrights for the selected semester
                patents = Patent.objects.filter(sem=semester)
                copyrights = Copyright.objects.filter(sem=semester)

                # Initialize counters
                div_patent_count = {}
                div_copyright_count = {}

                # Group patents by division
                for patent in patents:
                    div = patent.project.div
                    if div in div_patent_count:
                        div_patent_count[div] += 1
                    else:
                        div_patent_count[div] = 1

                # Group copyrights by division
                for copyright in copyrights:
                    div = copyright.project.div
                    if div in div_copyright_count:
                        div_copyright_count[div] += 1
                    else:
                        div_copyright_count[div] = 1

                # Prepare the data in the desired format
                # Overall counts for Patent and Copyright
                overall_data = [
                    {"name": "Patent", "value": sum(div_patent_count.values())},
                    {"name": "Copyright", "value": sum(div_copyright_count.values())}
                ]

                # Breakdown by division
                div_breakdown = {
                    "Patent": [{"name": div, "value": div_patent_count.get(div, 0)} for div in div_patent_count],
                    "Copyright": [{"name": div, "value": div_copyright_count.get(div, 0)} for div in div_copyright_count]
                }

                # Combine both overall data and breakdown
                data = {
                    "overall": overall_data,
                    "breakdown": div_breakdown
                }
                print(overall_data)
                print(div_breakdown)

                return Response(data, status=200)
            else:
                return Response({"error": "Semester or Division not found"}, status=status.HTTP_404_NOT_FOUND)

        except Sem.DoesNotExist:
            return Response({ "error": "Semester not found" }, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
    @action(detail=False, methods=["get"])
    def available_students(self, request):
        try:
            category = request.query_params.get('category')
            year = request.query_params.get('year')
            sem = request.query_params.get('sem')
            div = request.query_params.get('div')

            sem = None if (not sem or sem.lower() in ["null", "undefined"]) else sem.strip()
            div = None if (not div or div.lower() in ["null", "undefined"]) else div.strip()

            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()

            if not semester:
                return Response({"error": "Semester not found."}, status=status.HTTP_404)

            latest_entries = CurrentSem.objects.filter(
                id__in=CurrentSem.objects.values('student').annotate(
                    latest_id=Max('id')
                ).values('latest_id')
            )

            relevant_entries = latest_entries.filter(sem=semester)

            students_list = []
            for entry in relevant_entries.filter(form=0).select_related('student'):
                students_list.append({
                    "name": f"{entry.student.user.first_name} {entry.student.middle_name or ''} {entry.student.user.last_name}".strip(),
                    "moodle_id": entry.student.user.username
                })

            return Response({"students": students_list}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=["get"])
    def get_semesters_and_divisions(self, request):
        id = request.query_params.get('id')

        if not id:
            return Response({"error": "Year is required"}, status=400)

        year = Year.objects.get(id=id)
        if not year:
            return Response({"error": f"Year not found"}, status=404)

        sems = Sem.objects.filter(year=year)

        sem_div_map = {}
        for s in sems:
            if s.sem not in sem_div_map:
                sem_div_map[s.sem] = []
            sem_div_map[s.sem].append(s.div)

        return Response(sem_div_map, status=200)

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["get"], url_path="user-info")
    def get(self, request):
        user = request.user
        print(user.username)
        return Response({"username": user.username})

class ProjectViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=['get'], url_path='my-projects-sem-wise')
    def my_projects_sem_wise(self, request):
        teacher = Teacher.objects.filter(user=request.user).first()
        all_projects = Project.objects.filter(
            Q(project_guide=teacher) | Q(project_co_guide=teacher)
        ).select_related('sem')

        result = {}

        for project in all_projects:
            year = str(project.sem.year.year)
            sem_name = f"Sem {project.sem.sem}"
            division = project.div if project.div else project.sem.div

            if year not in result:
                result[year] = {}

            if sem_name not in result[year]:
                result[year][sem_name] = {}

            if division not in result[year][sem_name]:
                result[year][sem_name][division] = []

            result[year][sem_name][division].append(ProjectSerializer(project).data)

        return Response(result)

    @action(detail=False, methods=["get"], url_path="filtered-projects")
    def get_filtered_projects(self, request):
        user = request.user  # Logged-in user
        category = request.query_params.get('category', None)
        year = request.query_params.get('year', None)
        sem = request.query_params.get('sem', None)
        div = request.query_params.get('div', None)

        sem = None if (not sem or sem.lower() == "null") else sem.strip()
        div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()
        teacher = Teacher.objects.filter(user=user).first()

        if not teacher:
            return Response({"error": "User is not a teacher"}, status=403)

        # Step 1: Get the department
        dept = Department.objects.filter(name__iexact=category).first()
        if not dept:
            return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

        # Step 2: Get the year
        y = Year.objects.filter(department=dept, year=year).first()
        if not y:
            return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)


        # Step 4: Get the semester safely
        if div:
            semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            print(semester)
        else:
            semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()
            print(semester)

        if not semester:
            return Response(
                {"error": f"Semester '{sem}' with Division '{div}' not found for year '{year}'"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Step 5: Get teacher's role
        academic_role = teacher.role.name if teacher.role else None

        # Step 6: Check if teacher is a coordinator
        is_project_coordinator = semester.project_coordinator == teacher
        is_project_co_coordinator = semester.project_co_coordinator == teacher

        # Step 7: Assign projects
        if academic_role == "Head of Department" or is_project_coordinator or is_project_co_coordinator:
            projects = Project.objects.filter(sem=semester).order_by("id")
        else:
            prj = Project.objects.filter(sem=semester)
            projects = prj.filter(
                Q(project_guide=teacher) | Q(project_co_guide=teacher)
            ).distinct().order_by("id")

        serializer = ProjectSerializer(projects, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def get_project(self, request):
        try:
            category = request.query_params.get('category', None)
            year = request.query_params.get('year', None)
            sem = request.query_params.get('sem', None)
            group = request.query_params.get('group', None)

            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()
            
            dept = Department.objects.filter(name__iexact=category).first()
            y = Year.objects.filter(department=dept, year=year).first()

            semester = Sem.objects.filter(year=y, sem=sem).first()
            
            project = Project.objects.get(sem=semester, id=group)  # Assuming `id` is the unique identifier
            serializer = ProjectSerializer(project)
            print(project)
            return Response(serializer.data, status=200)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)
    
    @action(detail=False, methods=['get'])
    def get_user_projects(self, request):
        try:
            user = request.user
            projects = Project.objects.filter(
                Q(leader__user__username=user.username) | Q(members__user__username=user.username)  # Leader OR member
            ).exclude(
                sem__sem="Major Project"
            ).order_by('-id').distinct()

            project_data = projects.values('id', 'group_no', 'final_topic', 'div')
            return Response(project_data, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=True, methods=['get'])
    def get_project_pk(self, request, pk=None):  # Get pk from URL
        try:
            project = Project.objects.get(pk=pk)  # Or just id=pk
            serializer = ProjectSerializer(project)
            return Response(serializer.data, status=200)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)

    
    @action(detail=False, methods=['get'], url_path="status-project")
    def status_project(self,request):
        try:
            student = Student.objects.get(user=request.user) 
            sem = request.query_params.get('sem',None)
            cursem = CurrentSem.objects.filter(student=student).order_by("-id").first()
            visibility = False
            project = None
            if sem == "0":
                if cursem:
                    if cursem.sem.student_form == 1 and cursem.form == 0 :
                        visibility = True
                    return Response({"status": visibility, "project": None}, status=status.HTTP_200_OK)
            elif sem == "1":
                if cursem.sem.sem == "Major Project":
                    if cursem.sem.student_form == 1 and cursem.form == 0 :
                        visibility = True
                    elif cursem.sem.student_form == 1 and cursem.form == 1:
                        print("entered")
                        project = Project.objects.filter(
                            Q(sem=cursem.sem) & (Q(leader=student) | Q(members=student))
                        ).first()
                    if project:
                        serializer = ProjectSerializer(project)
                        return Response({"status": visibility, "project": serializer.data}, status=status.HTTP_200_OK)
                    else:
                        return Response({"status": visibility, "project": None}, status=status.HTTP_200_OK)
                else:
                    visibility = False
                    return Response({"status": visibility, "project": None}, status=status.HTTP_200_OK)
            return Response({"status": visibility, "project": None}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
    @action(detail=True, methods=['post'])
    @transaction.atomic
    def update_topic(self, request, pk=None):  # Get pk from URL
        try:
            data = request.data
            topic = data.get("name")
            abstract = data.get("abstract")
            print(topic,abstract)
            Project.objects.filter(pk=pk).update(final_topic=topic, final_abstract=abstract)
            return Response({"message":"Project data updated"}, status=200)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
    @action(detail=False, methods=['get'], url_path='tasks')
    def get_tasks_by_project(self, request):
        try:
            id = request.query_params.get('id',None)
            sem_value = request.query_params.get('sem_new',None)
            print(sem_value)
            project = Project.objects.get(pk=id)
            semester = project.sem
            weeks = Week.objects.filter(semester=semester, sem = sem_value).order_by('week_number')
            result = []
            for week in weeks:
                tasks = Task.objects.filter(week=week).order_by('sequence_number')
                task_submissions = ProjectTask.objects.filter(task__in=tasks, project=project)
            
                result.append({
                    "id": week.id,
                    "week": f"Week {week.week_number}",
                    "tasks": [
            {
                "task_id": task.id,
                "task": task.task,
                "status":task_submissions.filter(task=task).first().status if task_submissions.filter(task=task).exists() else "",
                "details": task_submissions.filter(task=task).first().details if task_submissions.filter(task=task).exists() else ""
            }
            for task in tasks],
                    "submitted": all(task_submissions.filter(task=task).exists() for task in tasks),
                    "is_final":ProjectWeekProgress.objects.get(project=project, week = week).is_final if ProjectWeekProgress.objects.filter(project=project, week = week).exists() else False,
                })
            print(result)
            
            return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
    @action(detail=False, methods=['get'])
    def weekly_progress_chart(self, request):
        try:
            sem_value = request.query_params.get('sem_new',None)
            project_id = self.request.query_params.get('id', None)
            if not project_id:
                return Response({"error": "Project ID is required"}, status=status.HTTP_400_BAD_REQUEST)

            try:
                prj = Project.objects.get(pk=project_id)
            except Project.DoesNotExist:
                return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)
            
            # Filter weeks for the given semester
            weeks = Week.objects.filter(sem=sem_value, semester=prj.sem).order_by('week_number')
            week_ids = weeks.values_list('id', flat=True)

            # Get all ProjectWeekProgress entries for those weeks
            progresses = ProjectWeekProgress.objects.filter(week_id__in=week_ids, project=prj)
            # Prepare data
            labels = []
            data = []

            for week in weeks:
                week_label = f"Week {week.week_number}"
                labels.append(week_label)

                # Find all progresses for that week
                week_progresses = progresses.filter(week=week)

                if week_progresses.exists():
                    avg_completion = week_progresses.first().completion_percentage
                else:
                    avg_completion = 0

                data.append(avg_completion)

            return Response({
                "labels": labels,
                "data": data
            })
        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
class ProjectPreferenceViewSet(viewsets.ModelViewSet):
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer
    permission_classes = [permissions.IsAuthenticated]

    @action(detail=False, methods=["get"], url_path="project-pref")
    def get_project_pref(self, request):
        def get_full_name(student):
            name_parts = [student.user.first_name]
            if student.middle_name:  # Only add middle name if it's not null
                name_parts.append(student.middle_name)
            name_parts.append(student.user.last_name)
            return " ".join(name_parts)

        try:
            projectId = request.query_params.get('projectID',None)
            project = Project.objects.get(id=projectId)
            if project.sem.sem == "Major Project":
                student_preferences = DomainPreference.objects.filter(project=project).order_by('rank')
                pref = {}
                for dp in student_preferences:
                    guide_preferences = GuidePreference.objects.filter(preference=dp).order_by("rank")

                    if dp.domain.name not in pref:
                        pref[dp.domain.name] = []

                    pref[dp.domain.name].extend(get_full_name(gp.teacher) for gp in guide_preferences)
                return Response(pref,status=status.HTTP_200_OK)
            else:
                student_preferences = MiniProjectGuidePreference.objects.filter(project=project).order_by("rank")
                pref = []
                for gp in student_preferences:
                    pref.append(get_full_name(gp.teacher))
                return Response(pref,status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
    @action(detail=False, methods=["post"])
    @transaction.atomic
    def save_project(self,request):
        data = request.data.get('payload', {})
        print(data)  
        leader_id = data.get('leaderId')
        def remove_title(name):
            return re.sub(r'^(Prof\.|Dr\.)\s+', '', name)
        try:
            with transaction.atomic(): 
                leader = Student.objects.get(user__username=leader_id)

                cursem = CurrentSem.objects.filter(student=leader).order_by("-id").first()

                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT setval(pg_get_serial_sequence('project', 'id'), 
                        COALESCE((SELECT MAX(id) FROM project) + 1, 1), false);
                        """
                    )
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT setval(pg_get_serial_sequence('project_members', 'id'), 
                        COALESCE((SELECT MAX(id) FROM project_members) + 1, 1), false);
                        """
                    )

                if Project.objects.filter(sem=cursem.sem, leader=leader).exists() or Project.objects.filter(sem=cursem.sem, members__in=[leader]).exists():
                    raise ValueError(f"Leader {leader.user.username} is already part of another group.")
 
                group = Project.objects.create(sem=cursem.sem, leader=leader)
                group.div = data.get('div')
                group.save()
                if cursem:  
                    cursem.form = 1  
                    cursem.save()

                members_data = data.get('members', [])  
                for member_data in members_data:
                    member_id = member_data.get('id')
                    if member_id:
                        member = Student.objects.get(user__username=member_id)
                        member_cursem = CurrentSem.objects.filter(student=member).order_by("-id").first()

                        # Ensure member has a valid CurrentSem and matches the leader's CurrentSem
                        if not member_cursem:
                            raise ValueError(f"Member {member.user.username} does not have a valid CurrentSem.")

                        if member_cursem.sem != cursem.sem:
                            raise ValueError(f"Member {member.user.username} is not in the same CurrentSem as the leader.")

                        if Project.objects.filter(sem=cursem.sem, members=member).exists() or Project.objects.filter(sem=cursem.sem, leader=member).exists():
                            raise ValueError(f"Member {member.user.username} is already part of another group.")

                        group.members.through.objects.create(project=group, student=member)
                        
                        member_cursem.form = 1
                        member_cursem.save()

                group.save() 

                preferences = data.pop('preferences')

                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT setval(pg_get_serial_sequence('domain_preference', 'id'), 
                        COALESCE((SELECT MAX(id) FROM domain_preference) + 1, 1), false);
                        """
                    )
                
                for preference_data in preferences:
                    domain_name = preference_data.get('domain')
                    domain_name = domain_name.strip()
                    print(domain_name)
                    domain = Domain.objects.get(name=domain_name)  # Get domain instance
                    
                    # Save domain preference
                    domain_pref = DomainPreference.objects.create(
                        project=group,
                        domain=domain,
                        rank=preferences.index(preference_data) + 1  # Assign rank based on list order
                    )
                    with connection.cursor() as cursor:
                        cursor.execute(
                            """
                            SELECT setval(pg_get_serial_sequence('guide_preference', 'id'), 
                            COALESCE((SELECT MAX(id) FROM guide_preference) + 1, 1), false);
                            """
                        )
                    # Save guide preferences
                    for i in range(1, 4):  # Loop for preference1, preference2, preference3
                        teacher_name = preference_data.get(f'preference{i}')
                        if teacher_name:
                            teacher_name = remove_title(teacher_name)

                            # Assuming 'teacher_name' is now in "FirstName LastName" format
                            first_name, last_name = teacher_name.split(' ', 1)
                            try:
                                teacher = Teacher.objects.get(user__first_name=first_name, user__last_name=last_name)
                            except Teacher.DoesNotExist:
                                raise ValueError(f"Teacher {teacher_name} not found.")

                            GuidePreference.objects.create(
                                preference=domain_pref,
                                teacher=teacher,
                                rank=i  # Rank corresponds to preference1, preference2, preference3
                            )

            return Response({"message": "Group created successfully!", "group_id": group.id}, status=status.HTTP_201_CREATED)

        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
    @action(detail=False, methods=['post'], url_path="create-group")
    @transaction.atomic
    def create_group(self, request):
        def remove_title(name):
            return re.sub(r'^(Prof\.|Dr\.)\s+', '', name)
        data = request.data
        print(data)  # Get the request data
        try:
            with transaction.atomic():  # Ensure the operation is atomic
                # Get the leader and current semester
                leader_id = data.get('leaderId')
                leader = Student.objects.get(user__username=leader_id)
                cursem = CurrentSem.objects.filter(student=leader).order_by("-id").first()

                # Set the serial sequence for project and project_members
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT setval(pg_get_serial_sequence('project', 'id'), 
                        COALESCE((SELECT MAX(id) FROM project) + 1, 1), false);
                        """
                    )
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT setval(pg_get_serial_sequence('project_members', 'id'), 
                        COALESCE((SELECT MAX(id) FROM project_members) + 1, 1), false);
                        """
                    )

                # Check if the leader is already part of another group
                if Project.objects.filter(sem=cursem.sem, leader=leader).exists() or Project.objects.filter(sem=cursem.sem, members__in=[leader]).exists():
                    raise ValueError(f"Leader {leader.user.username} is already part of another group.")

                # Create the group
                group = Project.objects.create(sem=cursem.sem, leader=leader)
                group.div = cursem.sem.div
                group.save()

                # Update the leader's CurrentSem form status
                if cursem:
                    cursem.form = 1
                    cursem.save()

                # Handle members
                members_data = data.get('members', [])
                for member_data in members_data:
                    member_id = member_data.get('id')
                    if member_id:
                        member = Student.objects.get(user__username=member_id)
                        member_cursem = CurrentSem.objects.filter(student=member).order_by("-id").first()

                        # Ensure member has a valid CurrentSem and matches the leader's CurrentSem
                        if not member_cursem:
                            raise ValueError(f"Member {member.user.username} does not have a valid CurrentSem.")

                        if member_cursem.sem != cursem.sem:
                            raise ValueError(f"Member {member.user.username} is not in the same CurrentSem as the leader.")

                        # Ensure member is not part of another group
                        if Project.objects.filter(sem=cursem.sem, members=member).exists() or Project.objects.filter(sem=cursem.sem, leader=member).exists():
                            raise ValueError(f"Member {member.user.username} is already part of another group.")

                        # Add member to the group
                        group.members.through.objects.create(project=group, student=member)

                        # Update the member's CurrentSem form status
                        member_cursem.form = 1
                        member_cursem.save()

                group.save()  # Save the group after adding all members

                # Handle preferences
                preferences = data.pop('selectedTeachers')
                print(preferences)
                # Save domain preferences
                # for preference_data in preferences:
            
                with connection.cursor() as cursor:
                    cursor.execute(
                        """
                        SELECT setval(pg_get_serial_sequence('mini_guide_preference', 'id'), 
                        COALESCE((SELECT MAX(id) FROM mini_guide_preference) + 1, 1), false);
                        """
                    )

                # Save MiniProjectGuidePreference for each teacher preference
                for i in range(1, 4):  # Loop for preference1, preference2, preference3
                    teacher_name = preferences[i-1]
                    print(teacher_name)
                    if teacher_name:
                        try:
                            teacher = Teacher.objects.get(user__username=teacher_name)
                        except Teacher.DoesNotExist:
                            raise ValueError(f"Teacher {teacher_name} not found.")

                        MiniProjectGuidePreference.objects.create(
                            project=group,
                            teacher=teacher,
                            rank=i  
                            )

                return Response({"message": "Group created successfully!", "group_id": group.id}, status=status.HTTP_201_CREATED)

        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=["post"])
    @transaction.atomic
    def manual_save_project(self,request):
        try:
            data = request.data
            with transaction.atomic(): 
                project = Project.objects.get(id=data.get("projectID"))
                if project.sem.sem == "Major Project":
                    teacher = Teacher.objects.get(user_id=data.get("guideID"))
                    project.domain = Domain.objects.get(id=data.get("domainID"))
                    project.project_guide = teacher
                    project.final = 0
                    project.save()
                    projectguide = ProjectGuide.objects.get(teacher=teacher, sem = project.sem)
                    projectguide.availability = projectguide.availability-1
                    projectguide.save()
                else:
                    teacher = Teacher.objects.get(user_id=data.get("guideID"))
                    project.project_guide = teacher
                    project.final = 0
                    project.save()
                    projectguide = ProjectGuide.objects.get(teacher=teacher, sem = project.sem)
                    projectguide.availability = projectguide.availability-1
                    projectguide.save()
            return Response({"message": "Group created successfully!"}, status=status.HTTP_201_CREATED)

        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)
        except Student.DoesNotExist:
            return Response({"error": "Student profile not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=["post"], url_path="create-project")
    @transaction.atomic
    def create_project(self, request):
        try:
            category = request.query_params.get('category', None)
            year = request.query_params.get('year', None)
            sem = request.query_params.get('sem', None)
            div = request.query_params.get('div', None)

            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()

            if not semester:
                return Response(
                    {"error": f"Semester '{sem}' with Division '{div}' not found for year '{year}'"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
            
            data = request.data
            
            leader_moodle_id = data.get('leader')
            members_moodle_ids = data.get('members', [])
            domain_id = data.get('domain')  # Optional based on semester
            guide_id = data.get('guide')
            co_guide_id = data.get('co_guide')
            division = data.get('division')

            # Validate leader
            leader = Student.objects.filter(user__username=leader_moodle_id).first()
            if not leader:
                return Response({"error": "Leader not found."}, status=400)

            # Validate members
            members = Student.objects.filter(user__username__in=members_moodle_ids)

            if len(members) != len(members_moodle_ids):
                return Response({"error": "Some members not found."}, status=400)

            leader_sem = CurrentSem.objects.filter(student=leader).order_by('-id').first()
            if not leader_sem:
                return Response({"error": "Current semester not found for leader."}, status=400)
            
            if leader_sem.sem != semester:
                return Response({"error": f"Leader is not in semester {semester.div}."}, status=400)

            # Validate semester of members
            for member in members:
                member_sem = CurrentSem.objects.filter(student=member).order_by('-id').first()
                if not member_sem:
                    return Response({"error": f"Current semester not found for member {member.user.username}."}, status=400)
                
                if member_sem.sem != semester:
                    return Response({"error": f"Member {member.user.username} is not in semester {semester.div}."}, status=400)

            # Validate guide
            guide = Teacher.objects.filter(user_id=guide_id).first()
            if not guide:
                return Response({"error": "Guide not found."}, status=400)
            with transaction.atomic():
                if sem == "Major Project":
                    co_guide = None
                    if co_guide_id:
                        co_guide = Teacher.objects.filter(user_id=co_guide_id).first()
                        if not co_guide:
                            return Response({"error": "Co-guide not found."}, status=400)

                    
                    domain = Domain.objects.filter(id=domain_id).first()
                    if not domain:
                        return Response({"error": "Domain not found."}, status=400)

                    # Assume you have a `Sem` object already assigned (find using leader or semester + division info)
                    current_sem = CurrentSem.objects.filter(student=leader).order_by('-id').first()
                    if not current_sem:
                        return Response({"error": "Current semester not found for leader."}, status=400)

                    existing_groups = Project.objects.filter(sem=semester, div=division)
                    last_group_no = len(existing_groups)
                    print(last_group_no)
                    no = last_group_no+1
                    # Step 3: New group number will be last + 1
                    new_group_no = f"{division.upper()}{no}"
                    
                    project = Project.objects.create(
                        leader=leader,
                        project_guide=guide,
                        project_co_guide=co_guide,
                        domain=domain,
                        sem=semester,
                        div=division.upper(),
                        final=0,
                        group_no=new_group_no,
                    )

                    # Add members
                    project.members.set(members)

                    leader_sem.form = 1
                    leader_sem.save()

                    # Update CurrentSem.form for members
                    CurrentSem.objects.filter(student__in=members).update(form=1)
                else:
                    existing_groups = Project.objects.filter(sem=semester)

                    # Step 2: Get the current maximum group number
                    last_group_no = len(existing_groups)
                    print(last_group_no)
                    no = last_group_no+1
                    # Step 3: New group number will be last + 1
                    new_group_no = f"{division.upper()}{no}"
                    project = Project.objects.create(
                        leader=leader,
                        project_guide=guide,
                        sem=semester,
                        div=semester.div,
                        final=0,
                        group_no=new_group_no,
                    )

                    

                    # Add members
                    project.members.set(members)

                    leader_sem.form = 1
                    leader_sem.save()

                    # Update CurrentSem.form for members
                    CurrentSem.objects.filter(student__in=members).update(form=1)

            
            return Response({"message": "Project created successfully!"}, status=201)

        except Exception as e:
            return Response({"error": str(e)}, status=500)

    @action(detail=True, methods=["put"], url_path="update")
    @transaction.atomic
    def update_project(self, request, pk=None):
        try:
            data = request.data

            # Fetch the project to update
            project = Project.objects.filter(id=pk).first()
            if not project:
                return Response({"error": "Project not found."}, status=404)

            leader_id = data.get('leader_id')
            member_ids = data.get('member_ids', [])
            guide_id = data.get('guide_id')
            co_guide_id = data.get('co_guide_id')
            domain_id = data.get('domain_id')

            leader = Student.objects.filter(user__username=leader_id).first()
            if not leader:
                return Response({"error": "Leader not found."}, status=400)

            members = Student.objects.filter(user__username__in=member_ids)
            if len(members) != len(member_ids):
                return Response({"error": "Some members not found."}, status=400)

            guide = Teacher.objects.filter(user_id=guide_id).first()
            if not guide:
                return Response({"error": "Guide not found."}, status=400)

            co_guide = None
            if co_guide_id:
                co_guide = Teacher.objects.filter(user_id=co_guide_id).first()
                if not co_guide:
                    return Response({"error": "Co-guide not found."}, status=400)

            if project.sem.sem == "Major Project":
                domain = Domain.objects.filter(id=domain_id).first()
                if not domain:
                    return Response({"error": "Domain not found."}, status=400)
                project.domain = domain
                project.project_co_guide = co_guide
                project.div = project.div.upper()
            else:
                project.project_co_guide = None

            project.leader = leader
            project.project_guide = guide

            project.members.set(members)
            project.save()

            return Response({"message": "Project updated successfully!"}, status=200)

        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
    @action(detail=False, methods=["post"], url_path="delete-project")
    @transaction.atomic
    def delete_project(self, request):
        try:
            project_ids = request.data.get("project_ids", [])
            if not project_ids:
                return Response({"error": "No project IDs provided"}, status=400)

            for project_id in project_ids:
                project = Project.objects.get(id=project_id)

                # Update guide and co-guide availability
                if project.project_guide:
                    pg = ProjectGuide.objects.get(sem=project.sem, teacher = project.project_guide)
                    pg.availability +=1
                    pg.save()

                # Reset CurrentSem form status for leader
                CurrentSem.objects.filter(student=project.leader, sem = project.sem).update(form=0)

                # Reset CurrentSem form status for members
                member_ids = project.members.values_list('user_id', flat=True)
                CurrentSem.objects.filter(student_id__in=member_ids, sem = project.sem).update(form=0)

                # Delete the project
                project.delete()

            return Response({"message": "Projects deleted successfully"}, status=200)

        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=404)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
    @action(detail=True, methods=['get'], url_path='fetch-project')
    def fetch_project(self, request, pk=None):
        try:
            project = Project.objects.get(pk=pk)

            data = {
                'leader': {
                    'name': f"{project.leader.user.first_name} {project.leader.middle_name or ''} {project.leader.user.last_name}".strip(),
                    'moodle_id': project.leader.user.username
                },
                'members': [
                    {
                        'name': f"{member.user.first_name} {member.middle_name or ''} {member.user.last_name}".strip(),
                        'moodle_id': member.user.username
                    }
                    for member in project.members.all()
                ],
                'division': project.div if project.div else None,
                'domain': project.domain.id if project.domain else None,
                'guide': project.project_guide.user.id if project.project_guide else None,
                'co_guide': project.project_co_guide.user.id if project.project_co_guide else None,
                'semester': project.sem.sem if project.sem else None,
            }
            return Response(data, status=status.HTTP_200_OK)

        except Project.DoesNotExist:
            return Response({'error': 'Project not found.'}, status=status.HTTP_404_NOT_FOUND)


class PublicationViewSet(viewsets.ModelViewSet):
    queryset = Publication.objects.all()
    serializer_class = PublicationSerializer

    def get_queryset(self):
        # Get the 'project' parameter from the query parameters (primary key)
        project_id = self.request.query_params.get('project', None)
        
        if project_id is not None:
            # Filter by project primary key
            return Publication.objects.filter(project_id=project_id)
        return Publication.objects.all()

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def create_or_update(self, request):
        project_id = self.request.query_params.get('project', None)
        if not project_id:
            return Response({"error": "Project ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            prj = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        publication_data = request.data
        publication, created = Publication.objects.update_or_create(
            id=publication_data.get('id', None),  # Check for existing ID
            defaults={
                'project': prj,
                'sem': prj.sem,  # Assuming 'sem' is related to the project
                'paper_name': publication_data.get('paper_name'),
                'conference_date': publication_data.get('conference_date'),
                'conference_name': publication_data.get('conference_name'),
            }
        )

        if created:
            return Response(PublicationSerializer(publication).data, status=status.HTTP_201_CREATED)
        return Response(PublicationSerializer(publication).data, status=status.HTTP_200_OK)

class CopyrightViewSet(viewsets.ModelViewSet):
    queryset = Copyright.objects.all()
    serializer_class = CopyrightSerializer

    def get_queryset(self):
        # Get the 'project' parameter from the query parameters (primary key)
        project_id = self.request.query_params.get('project', None)
        
        if project_id is not None:
            # Filter by project primary key
            return Copyright.objects.filter(project_id=project_id)
        return Copyright.objects.all()
    
    @action(detail=False, methods=['post'])
    @transaction.atomic
    def create_or_update(self, request):
        project_id = self.request.query_params.get('project', None)
        if not project_id:
            return Response({"error": "Project ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            prj = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        copyright_data = request.data
        copyright, created = Copyright.objects.update_or_create(
            id=copyright_data.get('id', None),  # Check for existing ID
            defaults={
                'project': prj,
                'sem': prj.sem,  # Assuming 'sem' is related to the project
                'project_title': copyright_data.get('project_title'),
                'filing_date': copyright_data.get('filing_date'),
                'status': copyright_data.get('status'),
                'registration_number': copyright_data.get('registration_number'),
            }
        )

        if created:
            return Response(CopyrightSerializer(copyright).data, status=status.HTTP_201_CREATED)
        return Response(CopyrightSerializer(copyright).data, status=status.HTTP_200_OK)

class PatentViewSet(viewsets.ModelViewSet):
    queryset = Patent.objects.all()
    serializer_class = PatentSerializer

    def get_queryset(self):
        # Get the 'project' parameter from the query parameters (primary key)
        project_id = self.request.query_params.get('project', None)
        
        if project_id is not None:
            # Filter by project primary key
            return Patent.objects.filter(project_id=project_id)
        return Patent.objects.all()

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def create_or_update(self, request):
        project_id = self.request.query_params.get('project', None)
        if not project_id:
            return Response({"error": "Project ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            prj = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return Response({"error": "Project not found"}, status=status.HTTP_404_NOT_FOUND)

        patent_data = request.data
        patent, created = Patent.objects.update_or_create(
            id=patent_data.get('id', None),  # Check for existing ID
            defaults={
                'project': prj,
                'sem': prj.sem,  # Assuming 'sem' is related to the project
                'project_title': patent_data.get('project_title'),
                'filing_date': patent_data.get('filing_date'),
                'status': patent_data.get('status'),
                'registration_number': patent_data.get('registration_number'),
            }
        )

        if created:
            return Response(PatentSerializer(patent).data, status=status.HTTP_201_CREATED)
        return Response(PatentSerializer(patent).data, status=status.HTTP_200_OK)

class ReviewViewSet(viewsets.ModelViewSet):
    
    @action(detail=False, methods=["get"], url_path="by-year")
    def by_year(self, request):
        year_id = request.query_params.get('id',None)
        year = Year.objects.get(id=year_id)
        events = AssessmentEvent.objects.filter(year=year).values("id", "name")
        return Response(list(events))

class AssessmentEventViewSet(viewsets.ModelViewSet):
    queryset = AssessmentEvent.objects.all()
    serializer_class = AssessmentPanelSerializer

    @action(detail=True, methods=["get"], url_path="event_detail")
    def event_detail(self, request, pk=None):
        try:
            event = AssessmentEvent.objects.get(pk=pk)
            panels = AssessmentPanel.objects.filter(event=event).order_by("panel_number")
            print(panels)
            serialized_panels = AssessmentPanelSerializer(panels, many=True).data

            # If needed, you can add event meta details as well
            return Response({
                "event": event.name,
                "panels": serialized_panels
            })

        except AssessmentEvent.DoesNotExist:
            return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=["get"], url_path="panel-data")
    def get_panel_data(self, request, pk=None):
        try:
            event = self.get_object()  # gets event by pk from URL
        except AssessmentEvent.DoesNotExist:
            return Response({"error": "Event not found"}, status=status.HTTP_404_NOT_FOUND)

        # Gather panels
        panels = AssessmentPanel.objects.filter(event=event).order_by("panel_number").prefetch_related("teachers__user", "groups__leader__user", "groups__members__user", "groups__domain", "groups__project_guide__user")
        panel_data = {}
        group_data = {}

        for panel in panels:
            panel_name = f"Panel {panel.panel_number}"

            panel_teachers = [
                {
                    "id": teacher.user.id,
                    "username": teacher.user.username,
                    "name": f"{teacher.user.first_name} {teacher.middle_name or ''} {teacher.user.last_name}".strip()
                }
                for teacher in panel.teachers.all()
            ]

            group_list = []
            for group in panel.groups.all():
                group_list.append({
                    "id": group.id,
                    "Group": f"{group.group_no}",
                    "Domain": group.domain.name if group.domain else "N/A",
                    "Guide": f"{group.project_guide.user.first_name} {group.project_guide.middle_name or ''} {group.project_guide.user.last_name}".strip() if group.project_guide else "N/A",
                })

            panel_data[panel_name] = panel_teachers
            group_data[panel_name] = group_list

        # Unassigned teachers
        unassigned_teachers = [
            {
                "id": ut.teacher.user.id,
                "username": ut.teacher.user.username,
                "name": f"{ut.teacher.user.first_name} {ut.teacher.middle_name or ''} {ut.teacher.user.last_name}".strip()
            }
            for ut in UnassignedTeacher.objects.filter(event=event).select_related("teacher__user")
        ]

        # Unassigned groups
        remaining_groups = []
        for ug in UnassignedGroup.objects.filter(event=event).select_related("group__leader__user", "group__domain", "group__project_guide__user"):
            group = ug.group
            remaining_groups.append({
                "id": group.id,
                "Group": f"{group.group_no}",
                "Domain": group.domain.name if group.domain else "N/A",
                "Guide": f"{group.project_guide.user.first_name} {group.project_guide.middle_name or ''} {group.project_guide.user.last_name}".strip() if group.project_guide else "N/A",
            })
        return Response({
            "panels": panel_data,
            "groups": group_data,
            "unassigned_teachers": unassigned_teachers,
            "remaining_groups": remaining_groups
        })

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def update_panels(self, request, *args, **kwargs):
        # Get the event object from the URL
        event = self.get_object()

        # Get the data from the request
        panels_data = request.data.get('panels', [])
        unassigned_data = request.data.get('unassigned', {})

        # Loop through each panel and update it
        for panel_data in panels_data:
            panel_name = panel_data.get('panel')
            teacher_ids = panel_data.get('teachers', [])
            student_ids = panel_data.get('students', [])

            if not panel_name:
                return Response({"error": "Panel name is missing"}, status=400)

            panel_number = int(panel_name.split(" ")[-1])
            panel, created = AssessmentPanel.objects.get_or_create(event=event, panel_number=panel_number)

            teachers = Teacher.objects.filter(user_id__in=teacher_ids)
            panel.teachers.set(teachers)

            groups = Project.objects.filter(id__in=student_ids)
            panel.groups.set(groups)

            panel.save()

        # Handle unassigned teachers
        for teacher_id in unassigned_data.get('teachers', []):
            teacher = Teacher.objects.get(user_id=teacher_id)
            UnassignedTeacher.objects.get_or_create(event=event, teacher=teacher)

        # Handle unassigned groups
        for group_id in unassigned_data.get('students', []):
            group = Project.objects.get(id=group_id)
            UnassignedGroup.objects.get_or_create(event=event, group=group)

        return Response({"message": "Panels updated successfully!"})

class WeekViewSet(viewsets.ModelViewSet):
    queryset = Week.objects.all()
    serializer_class = WeekSerializer

    @action(detail=False, methods=['post'], url_path='add-weekly-tasks')
    @transaction.atomic
    def add_weekly_tasks(self, request):
        try:
            category = request.query_params.get('category', None)
            year = request.query_params.get('year', None)
            sem = request.query_params.get('sem', None)
            div = request.query_params.get('div', None)

            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()

            if not semester:
                return Response(
                    {"error": f"Semester '{sem}' with Division '{div}' not found for year '{year}'"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            sem_value = None
            if sem == "Major Project":
                sem_value = "sem_7" if request.data.get("sem") == "Sem 7" else "sem_8" 
                task_key = sem_value
            else:
                task_key = semester.sem 

            tasks_for_sem = PREDEFINED_TASKS_BY_SEM.get(task_key)
            print(f"Creating for: {sem_value}")
            print(f"Task keys: {list(tasks_for_sem.keys())}")
            if not tasks_for_sem:
                return Response({"error": f"No predefined tasks found for {task_key}"}, status=400)
            
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT setval(pg_get_serial_sequence('api_week', 'id'), "
                    "COALESCE((SELECT MAX(id) FROM api_week) + 1, 1), false);"
                )
            with transaction.atomic():
                for week_num, tasks in tasks_for_sem.items():
                    week_obj = Week.objects.create(
                        semester=semester, week_number=week_num, sem=sem_value
                    )
                    for idx, task_text in enumerate(tasks):
                        Task.objects.create(
                            week=week_obj,
                            task=task_text,
                            sequence_number=idx + 1
                        )

            return Response({'message': 'Weekly tasks added successfully'}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='formatted', url_name='formatted')
    def get_formatted_weekly_tasks(self, request):
        try:
            category = request.query_params.get('category', None)
            year = request.query_params.get('year', None)
            sem = request.query_params.get('sem', None)
            div = request.query_params.get('div', None)

            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()

            if not semester:
                return Response(
                    {"error": f"Semester '{sem}' with Division '{div}' not found for year '{year}'"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if sem == "Major Project":
                result = {
                    "sem_7": [],
                    "sem_8": []
                }

                # Get semester 7 and 8 weeks
                for sem_key in ['sem_7', 'sem_8']:
                    weeks = Week.objects.filter(semester=semester, sem=sem_key).order_by('week_number')
                    for week in weeks:
                        tasks = Task.objects.filter(week=week).order_by('sequence_number')
                        result[sem_key].append({
                            "week": str(week.week_number),
                            "task": [task.task for task in tasks]
                        })

                return Response(result)
            else:
                weeks = Week.objects.filter(semester=semester).order_by('week_number')
                result = []

                for week in weeks:
                    tasks = Task.objects.filter(week=week).order_by('sequence_number')
                    result.append({
                        "week": str(week.week_number),
                        "task": [task.task for task in tasks]
                    })

                return Response(result, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=["post"])
    @transaction.atomic
    def create_or_update_week(self, request):
        try:
            data = request.data
            week_number = data.get('week_number')
            tasks = data.get('tasks', [])
            category = request.query_params.get('category', None)
            year = request.query_params.get('year', None)
            sem = request.query_params.get('sem', None)
            div = request.query_params.get('div', None)

            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()

            if not semester:
                return Response(
                    {"error": f"Semester '{sem}' with Division '{div}' not found for year '{year}'"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            sem_value = None
            if sem == "Major Project":  # or whatever the correct condition is
                sem_value = "sem_7" if data.get("sem") == "Sem 7" else "sem_8"
            # Create or update Week
            with transaction.atomic():
                week, _ = Week.objects.update_or_create(
                    semester=semester,
                    week_number=week_number,
                    sem=sem_value
                )
                print(week)
                # Create or update tasks
                for i, task in enumerate(tasks, start=1):
                    Task.objects.update_or_create(
                        week=week,
                        sequence_number=i,
                        defaults={'task': task}
                    )

                week.tasks.filter(sequence_number__gt=len(tasks)).delete()

            return Response({"message": "Week and tasks saved successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=["delete"])
    @transaction.atomic
    def delete_week(self, request):
        try:
            category = request.query_params.get("category")
            year = request.query_params.get("year")
            sem = request.query_params.get("sem")
            div = request.query_params.get("div")
            week_number = request.query_params.get("week_number")

            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": "Department not found"}, status=status.HTTP_400_BAD_REQUEST)

            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": "Year not found"}, status=status.HTTP_400_BAD_REQUEST)

            semester = Sem.objects.filter(year=y, sem=sem, div=div).first() if div else Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()
            if not semester:
                return Response({"error": "Semester not found"}, status=status.HTTP_400_BAD_REQUEST)

            sem_value = None
            if sem == "Major Project":  # or whatever the correct condition is
                sem_value = "sem_7" if request.data.get("sem") == "Sem 7" else "sem_8"

            week = Week.objects.filter(semester=semester, week_number=week_number, sem=sem_value).first()
            if not week:
                return Response({"error": "Week not found"}, status=status.HTTP_404_NOT_FOUND)

            

            with transaction.atomic():
                week.delete()

                # Reorder remaining weeks
                weeks = Week.objects.filter(semester=semester, sem=sem_value).order_by("week_number")
                for i, w in enumerate(weeks, start=1):
                    print(i)
                    w.week_number = i
                    w.save()

            return Response({"message": f"Week {week_number} deleted successfully"}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['get'], url_path='weekly-chart-data')
    def get_weekly_chart_data(self, request):
        category = request.query_params.get('category')
        year = request.query_params.get('year')
        sem = request.query_params.get('sem')
        div = request.query_params.get('div', None)
        
        sem = None if (not sem or sem.lower() == "null") else sem.strip()
        div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

        dept = Department.objects.filter(name__iexact=category).first()
        if not dept:
            return Response({"error": "Department not found"}, status=status.HTTP_400_BAD_REQUEST)

        y = Year.objects.filter(department=dept, year=year).first()
        if not y:
            return Response({"error": "Year not found"}, status=status.HTTP_400_BAD_REQUEST)

        semester = Sem.objects.filter(year=y, sem=sem, div=div).first() if div else Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()
        if not semester:
            return Response({"error": "Semester not found"}, status=status.HTTP_400_BAD_REQUEST)

        data = {}

        if sem == "Major Project":
            for s in ['sem_7', 'sem_8']:
                weeks = Week.objects.filter(
                    semester__year__year=year,
                    semester__year__department__name__iexact=category,
                    semester__sem=sem,
                    semester__div=div if div else None,
                    sem=s
                ).annotate(
                    group_count=Count('projectweekprogress', filter=Q(projectweekprogress__is_final=True))
                ).order_by('week_number')

                data[s] = [
                    {"week": f"Week {w.week_number}", "groups": w.group_count}
                    for w in weeks
                ]
        else:
            weeks = Week.objects.filter(
                semester__year__year=year,
                semester__year__department__name__iexact=category,
                semester__sem=sem,
                semester__div=div if div else None
            ).annotate(
                group_count=Count('projectweekprogress', filter=Q(projectweekprogress__is_final=True))
            ).order_by('week_number')

            data["default"] = [
                {"week": f"Week {w.week_number}", "groups": w.group_count}
                for w in weeks
            ]

        return Response(data)

class ProjectTaskViewSet(viewsets.ModelViewSet):
    queryset = ProjectTask.objects.all()
    serializer_class = ProjectTaskSerializer

    # Custom action to submit task statuses
    @action(detail=False, methods=['post'], url_path='submit-task-status')
    @transaction.atomic
    def submit_task_status(self, request):
        try:
            project_id = request.data.get('project_id')
            task_statuses = request.data.get('task_statuses')  # List of task data

            if not project_id or not task_statuses:
                return Response({'error': 'Project ID and task statuses are required'}, status=status.HTTP_400_BAD_REQUEST)
            with connection.cursor() as cursor:
                cursor.execute(
                    "SELECT setval(pg_get_serial_sequence('api_projecttask', 'id'), "
                    "COALESCE((SELECT MAX(id) FROM api_projecttask) + 1, 1), false);"
                )
            # Loop through the task statuses and update ProjectTask entries
            for task_data in task_statuses:
                task_id = task_data.get('task_id')
                task_status = task_data.get('status')
                details = task_data.get('details')
                
                # Validate required fields
                if not task_id or status is None:
                    return Response({'error': 'Task ID and status are required for each task'}, status=status.HTTP_400_BAD_REQUEST)
                
                # Get or create ProjectTask entry
                project_task, created = ProjectTask.objects.get_or_create(
                    project_id=project_id, 
                    task_id=task_id,
                )
                project_task.status = task_status
                project_task.details = details
                project_task.save()

            return Response({'message': 'Task statuses updated successfully'}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=['post'], url_path='submit-logbook')
    @transaction.atomic
    def submit_logbook(self, request):
        try:
            project_id = request.data.get('project_id')
            week_id = request.data.get('week_id')
            task_statuses = request.data.get('task_statuses')  # List of task_id and details
            completion = request.data.get('completion_percentage')
            date = request.data.get('date')
            remarks = request.data.get('remarks')
            print(project_id)
            print(week_id)

            if not project_id or not week_id or not task_statuses:
                return Response({'error': 'Project ID, week ID and task statuses are required'}, status=status.HTTP_400_BAD_REQUEST)

            # Save task descriptions
            for task_data in task_statuses:
                task_id = task_data.get('task_id')
                details = task_data.get('details')

                if not task_id:
                    return Response({'error': 'Task ID is required for each task'}, status=status.HTTP_400_BAD_REQUEST)

                project_task = ProjectTask.objects.get(project_id=project_id, task_id=task_id)

                project_task.details = details
                project_task.save()

            # Save week progress (only once)
            ProjectWeekProgress.objects.get_or_create(
                project_id=project_id,
                week_id=week_id,
                defaults={'completion_percentage': completion, 'remarks': remarks , "is_final":True, "submitted_date":date}
            )

            return Response({'message': 'Task statuses and progress updated successfully'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class StudentProfileViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentProfileSerializer

    def get_queryset(self):
        return Student.objects.filter(user=self.request.user)
    
    def list(self, request):
        try:
            student = Student.objects.get(user=request.user)
            serializer = StudentProfileSerializer(student)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({'error': 'Student profile not found.'}, status=404)
    
    @action(detail=False, methods=['patch'], url_path='update-profile')
    @transaction.atomic
    def update_profile(self, request):
        try:
            teacher = Student.objects.get(user=request.user)
            user = request.user  # access the User model

            # Update User fields
            user.first_name = request.data.get('first_name', user.first_name)
            user.last_name = request.data.get('last_name', user.last_name)
            user.email = request.data.get('email', user.email)
            user.save()

            # Update Teacher model fields
            teacher.middle_name = request.data.get('middle_name', teacher.middle_name)
            teacher.save()

            return Response({
                "message": "Profile updated successfully."
            }, status=status.HTTP_200_OK)
        except Teacher.DoesNotExist:
            return Response({'error': 'Teacher profile not found.'}, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['post'])
    @transaction.atomic
    def update_password(self, request):
        user = request.user
        data = request.data
        current = data.get("current_password")
        new = data.get("new_password")

        if not user.check_password(current):
            return Response({"error": "Current password is incorrect."}, status=400)

        user.set_password(new)
        user.save()
        return Response({"success": "Password updated successfully."}, status=200)
    
class TeacherProfileViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all()
    serializer_class = TeacherSerializer

    def get_queryset(self):
        return Teacher.objects.filter(user=self.request.user)
    
    def list(self, request):
        try:
            student = Teacher.objects.get(user=request.user)
            serializer = TeacherSerializer(student)
            return Response(serializer.data)
        except Student.DoesNotExist:
            return Response({'error': 'Teacher profile not found.'}, status=404)
    
    @action(detail=False, methods=['patch'], url_path='update-profile')
    @transaction.atomic
    def update_profile(self, request):
        try:
            teacher = Teacher.objects.get(user=request.user)
            user = request.user  # access the User model

            # Update User fields
            user.first_name = request.data.get('first_name', user.first_name)
            user.last_name = request.data.get('last_name', user.last_name)
            user.email = request.data.get('email', user.email)
            user.save()

            # Update Teacher model fields
            teacher.middle_name = request.data.get('middle_name', teacher.middle_name)
            teacher.title = request.data.get('title', teacher.title)
            teacher.experience = request.data.get('experience', teacher.experience)
            teacher.save()

            return Response({
                "message": "Profile updated successfully."
            }, status=status.HTTP_200_OK)
        except Teacher.DoesNotExist:
            return Response({'error': 'Teacher profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        
    @action(detail=False, methods=['post'])
    @transaction.atomic
    def update_password(self, request):
        user = request.user
        data = request.data
        current = data.get("current_password")
        new = data.get("new_password")

        if not user.check_password(current):
            return Response({"error": "Current password is incorrect."}, status=400)

        user.set_password(new)
        user.save()
        return Response({"success": "Password updated successfully."}, status=200)

class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = AssessmentRubric.objects.all()

    @action(detail=False, methods=['get'], url_path='rubrics')
    def get_rubrics(self, request):
        event_id = request.query_params.get("id")
        rubrics = AssessmentRubric.objects.filter(event__id=event_id)
        print(rubrics)
        serializer = AssessmentRubricSerializer(rubrics, many=True)
        return Response(serializer.data)

class ProjectAssessmentViewSet(viewsets.ModelViewSet):
    queryset = ProjectAssessment.objects.all()
    serializer_class = ProjectAssessmentSerializer

    @action(detail=False, methods=['get'], url_path='get-assessment')
    def get_assessment(self, request):
        project_id = request.query_params.get('project')
        event_id = request.query_params.get('event')
        if not project_id or not event_id:
            return Response({"error": "Project and Event IDs required."}, status=400)
        
        try:
            assessment = ProjectAssessment.objects.get(project_id=project_id, event_id=event_id)
            # Fetch related marks for this assessment
            marks = AssessmentMark.objects.filter(project_assessment=assessment).values('rubric_id', 'marks')

            # Serialize the assessment and add marks to it
            assessment_data = ProjectAssessmentSerializer(assessment).data
            assessment_data['marks'] = list(marks)

            return Response(assessment_data)
        except ProjectAssessment.DoesNotExist:
            return Response({"message": "No assessment found."}, status=404)

class UploadViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer
    parser_classes = (MultiPartParser, FormParser)

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def resource_upload(self, request):
        category = self.request.query_params.get('category', None)
        year = self.request.query_params.get('year', None)
        sem = self.request.query_params.get('sem', None)
        div = self.request.query_params.get('div', None)

        sem = None if (not sem or sem.lower() == "null") else sem.strip()
        div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

        dept = Department.objects.filter(name__iexact=category).first()
        if not dept:
            return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

        y = Year.objects.filter(department=dept, year=year).first()
        if not y:
            return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

        if div is not None:
            semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
        else:
            semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()

        if not semester:
            return Response(
                {"error": f"Semester '{sem}' with Division '{div}' not found for year '{year}'"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        name = request.data.get('name')
        file_obj = request.FILES.get('file')  # file input

        if not name or not file_obj:
            return Response({"error": "Missing 'name' or 'file'"}, status=status.HTTP_400_BAD_REQUEST)

        # Create Upload instance manually
        upload = Resource.objects.create(
            semester=semester,
            name=name,
            file=file_obj
        )

        return Response({"message": "Uploaded Successfully!"}, status=status.HTTP_201_CREATED)

    def get_queryset(self):
        queryset = super().get_queryset()

        category = self.request.query_params.get('category')
        year = self.request.query_params.get('year')
        sem = self.request.query_params.get('sem')
        div = self.request.query_params.get('div')
        sem = None if (not sem or sem.lower() == "null") else sem.strip()
        div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()
        if category and year:
            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Resource.objects.none()
            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Resource.objects.none()
            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()
            print(semester)
            if semester:
                print(semester)
                queryset = queryset.filter(semester=semester)
            else:
                return Resource.objects.none()

        return queryset

class ResourceViewSet(viewsets.ModelViewSet):
    queryset = Resource.objects.all()
    serializer_class = ResourceSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        project_id = self.request.query_params.get('project_id')

        if project_id:
            try:
                project = Project.objects.get(id=project_id)
                semester = project.sem  # assumes project has a 'sem' field
                queryset = queryset.filter(semester=semester)
            except Project.DoesNotExist:
                return Resource.objects.none()

        return queryset

class UploadLinkViewSet(viewsets.ModelViewSet):
    queryset = Link.objects.all()
    serializer_class = LinkSerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        project_id = self.request.query_params.get('project_id')

        if project_id:
            try:
                project = Project.objects.get(id=project_id)
                semester = project.sem  # assumes project has a 'sem' field
                queryset = queryset.filter(semester=semester)
            except Project.DoesNotExist:
                return Link.objects.none()

        return queryset

class LinkViewSet(viewsets.ModelViewSet):
    queryset = Link.objects.all()
    serializer_class = LinkSerializer

    @action(detail=False, methods=['post'])
    @transaction.atomic
    def create_link(self, request):
        category = self.request.query_params.get('category', None)
        year = self.request.query_params.get('year', None)
        sem = self.request.query_params.get('sem', None)
        div = self.request.query_params.get('div', None)

        sem = None if (not sem or sem.lower() == "null") else sem.strip()
        div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

        dept = Department.objects.filter(name__iexact=category).first()
        if not dept:
            return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

        y = Year.objects.filter(department=dept, year=year).first()
        if not y:
            return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

        if div is not None:
            semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
        else:
            semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()

        if not semester:
            return Response(
                {"error": f"Semester '{sem}' with Division '{div}' not found for year '{year}'"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        name = request.data.get('name')
        file_obj = request.data.get('link_type')  # file input

        if not name or not file_obj:
            return Response({"error": "Missing 'name' or 'file'"}, status=status.HTTP_400_BAD_REQUEST)

        # Create Upload instance manually
        upload = Link.objects.create(
            semester=semester,
            name=name,
            link_type=file_obj
        )

        return Response({"message": "Uploaded Successfully!"}, status=status.HTTP_201_CREATED)

    def get_queryset(self):
        queryset = super().get_queryset().annotate(total_uploads=Count('link_uploads'))

        category = self.request.query_params.get('category')
        year = self.request.query_params.get('year')
        sem = self.request.query_params.get('sem')
        div = self.request.query_params.get('div')
        sem = None if (not sem or sem.lower() == "null") else sem.strip()
        div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()
        if category and year:
            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Link.objects.none()
            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Link.objects.none()
            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()
            print(semester)
            if semester:
                print(semester)
                queryset = queryset.filter(semester=semester)
            else:
                return Link.objects.none()

        return queryset

class LinkUploadViewSet(viewsets.ModelViewSet):
    queryset = LinkUpload.objects.all()
    serializer_class = LinkUploadSerializer
    parser_classes = [MultiPartParser, FormParser]

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        link_id = request.data.get("link")
        project_id = request.data.get("project")
        title = request.data.get("title")
        file = request.FILES.get("file")

        if not all([link_id, project_id, file]):
            return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

        upload = LinkUpload.objects.create(
            link_id=link_id,
            project_id=project_id,
            title=title or file.name,
            file=file
        )
        return Response({"message": "Upload successful"}, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'])
    def my_uploads(self, request):
        project_id = request.query_params.get("project_id")
        if not project_id:
            return Response({"error": "Project ID required"}, status=400)
        
        uploads = self.queryset.filter(project_id=project_id)
        serializer = self.get_serializer(uploads, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"], url_path="grouped-by-division")
    def grouped_by_division(self, request):
        link_id = request.query_params.get("link_id")
        if not link_id:
            return Response({"error": "Missing link_id"}, status=400)

        uploads = LinkUpload.objects.select_related("project").filter(link_id=link_id)
        grouped_data = defaultdict(list)

        for upload in uploads:
            div = upload.project.div if upload.project and upload.project.div else "Unknown"
            grouped_data[div].append({
                "group_no": upload.project.group_no,
                "title": upload.project.final_topic,
                "file": upload.file.name
            })

        return Response(grouped_data)
    
    @action(detail=False, methods=['get'], url_path='link-upload-status')
    def link_upload_status_excel(self, request):
        try:
            category = request.query_params.get('category')
            year = request.query_params.get('year')
            sem = request.query_params.get('sem')
            div = request.query_params.get('div')
            link_id = request.query_params.get('link_id')

            if not link_id or not link_id.isdigit():
                return Response({"error": "Invalid or missing link ID"}, status=status.HTTP_400_BAD_REQUEST)

            sem = None if (not sem or sem.lower() == "null") else sem.strip()
            div = None if (not div or div.lower() == "null" or div.lower() == "undefined") else div.strip()

            dept = Department.objects.filter(name__iexact=category).first()
            if not dept:
                return Response({"error": f"Department '{category}' not found"}, status=status.HTTP_400_BAD_REQUEST)

            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department '{category}'"}, status=status.HTTP_400_BAD_REQUEST)

            if div is not None:
                semester = Sem.objects.filter(year=y, sem=sem, div=div).first()
            else:
                semester = Sem.objects.filter(year=y, sem=sem, div__isnull=True).first()

            if not semester:
                return Response({"error": "Semester not found"}, status=status.HTTP_400_BAD_REQUEST)
            
            if semester:
                project_coordinator = semester.project_coordinator
                project_co_coordinator = semester.project_co_coordinator
                class_incharge = semester.class_incharge
            
            sem_value = None
            if sem == "Major Project":  # or whatever the correct condition is
                sem_value = request.query_params.get('sem_new', None)

            hod = Teacher.objects.filter(department=dept, role__name="Head of Department").first()
            footer_data = [
                (project_coordinator, "Project Co-Coordinator"),
                (project_co_coordinator, "Project Co-ordinator"),
                (class_incharge, "Class In-charge"),
                (hod, "HOD")
            ]

            link = Link.objects.filter(id=int(link_id), semester=semester).first()
            if not link:
                return Response({"error": "Link not found for the given semester"}, status=status.HTTP_400_BAD_REQUEST)

            all_projects = Project.objects.filter(sem=semester).order_by("div", "id")
            uploaded_project_ids = LinkUpload.objects.filter(link=link).values_list('project_id', flat=True)

            uploaded_projects = all_projects.filter(id__in=uploaded_project_ids)
            not_uploaded_projects = all_projects.exclude(id__in=uploaded_project_ids)

            def get_project_info(project):
                moodle_ids = []
                student_names = []

                def get_full_name(student):
                    name_parts = [student.user.first_name]
                    if student.middle_name:
                        name_parts.append(student.middle_name)
                    name_parts.append(student.user.last_name)
                    return " ".join(name_parts)

                if project.leader:
                    moodle_ids.append(project.leader.user.username)
                    student_names.append(get_full_name(project.leader))

                if project.members.exists():
                    moodle_ids.extend([member.user.username for member in project.members.all()])
                    student_names.extend([get_full_name(member) for member in project.members.all()])

                teacher = []
                if project.project_guide:
                    teacher.append(get_full_name(project.project_guide))
                if project.project_co_guide:
                    teacher.append(get_full_name(project.project_co_guide))

                return [project.group_no, moodle_ids, student_names, "\n".join(teacher)]

            uploaded_data = [get_project_info(p) for p in uploaded_projects]
            not_uploaded_data = [get_project_info(p) for p in not_uploaded_projects]

            output = BytesIO()
            workbook = xlsxwriter.Workbook(output, {'in_memory': True})

            def write_sheet(sheet_name, data):
                worksheet = workbook.add_worksheet(sheet_name)
                title_format = workbook.add_format({
                    'bold': True,
                    'font_size': 14,
                    'align': 'center',
                    'valign': 'vcenter'
                })

                subtitle_format = workbook.add_format({
                    'bold': True,
                    'font_size': 12,
                    'align': 'center',
                    'valign': 'vcenter'
                })

                header_format = workbook.add_format({
                    'bold': True,
                    # 'bg_color': '#D3D3D3',
                    'border': 1,
                    'align': 'center',
                    'valign': 'vcenter'
                })

                cell_format = workbook.add_format({
                    'border': 1,
                    'align': 'left',
                    'valign': 'vcenter'
                })

                merged_cell_format = workbook.add_format({
                    'border': 1,
                    'align': 'center',
                    'valign': 'vcenter'
                })

                merged_guide_format = workbook.add_format({
                    'border': 1,
                    'align': 'center',
                    'valign': 'vcenter',
                    'text_wrap': True  
                })

                image_path = os.path.join(settings.BASE_DIR, 'images', 'image.png')
                worksheet.insert_image('B1', image_path, {'x_scale': 1, 'y_scale': 1, 'url': '', 'align': 'center'})
                worksheet.set_row(1,40)
                
                worksheet.set_column('A:A', 15)  
                worksheet.set_column('B:B', 30) 
                worksheet.set_column('C:C', 40)  
                worksheet.set_column('D:D', 40) 

                headers = ["Group Number", "Moodle ID", "Name of the Student", "Project Guide & Co-Guide"]
                for col_num, header in enumerate(headers):
                    worksheet.write(8, col_num, header, header_format)  
            
                row = 4 
                for group_no, moodle_ids, student_names, guides in data:
                    group_size = len(student_names)  
                    if group_size > 1: 
                        worksheet.merge_range(row, 0, row + group_size - 1, 0, group_no, merged_cell_format)  
                        worksheet.merge_range(row, 3, row + group_size - 1, 3, guides, merged_guide_format)  

                    for i in range(group_size):  
                        worksheet.write(row, 1, moodle_ids[i], cell_format)  
                        worksheet.write(row, 2, student_names[i], cell_format)  
                        row += 1  

                footer_row = row + 10  

                footer_format = workbook.add_format({
                    'bold': True,
                    'align': 'justify',  
                    'valign': 'vcenter',
                    'text_wrap': True 
                })


                worksheet.set_column('A:D', 25)

                for idx, (teacher, role) in enumerate(footer_data):
                    if teacher:
                        full_name = f"{teacher.user.first_name} {teacher.middle_name if teacher.middle_name else ''} {teacher.user.last_name}".strip()
                        worksheet.write(footer_row, idx, f"{full_name}\n({role})", footer_format)

            
                for idx, (teacher, role) in enumerate(footer_data):
                    if not teacher:
                        worksheet.write(footer_row, idx, f"Not Available\n({role})", footer_format)
                

            write_sheet("Uploaded", uploaded_data)
            write_sheet("Not Uploaded", not_uploaded_data)

            workbook.close()
            output.seek(0)

            response = HttpResponse(
                output,
                content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            )
            response['Content-Disposition'] = 'attachment; filename="link_upload_status.xlsx"'
            return response

        except Exception as e:
            return HttpResponse(f"Error generating Excel: {e}", status=500)


    