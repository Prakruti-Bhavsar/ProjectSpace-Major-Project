import re
from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from .serializers import *
from .models import *
from rest_framework.response import Response
from django.db import transaction, IntegrityError, connection
from django.contrib.auth.models import User
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
from django.db.models import Q
from django.db.models import Max, Subquery, OuterRef

import json

from functools import partial
from .genetic_algorithm import run_evolution, generate_population, fitness, Teachers, Group

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

class ClusteringViewSet(viewsets.ModelViewSet):
    serializer_class = SemSerializer
    @action(detail=False, methods=['post'])
    def cluster_and_allocate(self, request):
        try:
            year = request.data['year']
            event_name = request.data['eventName']
            dept = Department.objects.filter(name__iexact="Information Technology").first()
            if not dept:
                return Response({"error": f"Department not found"}, status=status.HTTP_400_BAD_REQUEST)

            y = Year.objects.filter(department=dept, year=year).first()
            if not y:
                return Response({"error": f"Year '{year}' not found for department"}, status=status.HTTP_400_BAD_REQUEST)
            teachers = defaultdict(list)
    
            teacher_prefs = TeacherPreference.objects.select_related('teacher__user', 'domain') \
                .filter(teacher__department__name="Information Technology").order_by('preference_rank')
            
            for pref in teacher_prefs:
                first_name = pref.teacher.user.first_name
                middle_name = pref.teacher.middle_name or ""  
                last_name = pref.teacher.user.last_name

                full_name = f"Prof. {first_name} {middle_name + ' ' if middle_name else ''}{last_name}"
                
                domain_name = pref.domain.name
                teachers[pref.teacher.user.username].append(domain_name)

            groups = []
    
            semester = Sem.objects.filter(year=y, sem="Major Project").first()
            projects = Project.objects.filter(sem=semester).select_related('domain', 'project_guide')

            for project in projects:
                
                domain_name = project.domain.name if project.domain else "Unknown Domain"
                guide_name = f"Prof. {project.project_guide.user.first_name} {project.project_guide.middle_name + ' ' if project.project_guide.middle_name else ''}{project.project_guide.user.last_name}" if project.project_guide else "No Guide Assigned"

                groups.append({
                    "Group": project.id,
                    "Domain": domain_name,
                    "Guide": project.project_guide.user.username
                })

            domains = list(Domain.objects.values_list('name', flat=True))
            num_panels = int(request.data['noOfPanels'])
            teachers_per_panel = int(request.data['noOfTeachers'])

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

           
            return Response({"event_id": event.id}, status=200)

        except Exception as e:
            print("Error during clustering and allocation:", e)
            return Response({"error": str(e)}, status=400)


class GuideAllocationViewSet(viewsets.ViewSet):

    @action(detail=False, methods=['get'])
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
            max_groups = guide_entry.availability if guide_entry else 0
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

                   
                    if assigned_domain in pref and assigned_teacher in pref[assigned_domain]:
                        automatic_allocations.append({
                            "group_id": project.id,
                            "domain": assigned_domain,
                            "teacher": assigned_teacher
                        })
                       
                        Project.objects.update_or_create(
                            id=group.id, 
                            sem=semester,
                            defaults={
                                "project_guide": Teacher.objects.get(user__username=assigned_teacher),
                                "domain": Domain.objects.get(name=assigned_domain)
                            }
                        )
                    elif assigned_domain in teacher_pref_domains and assigned_domain in pref:
                        automatic_allocations.append({
                            "group_id": project.id,
                            "domain": assigned_domain,
                            "teacher": assigned_teacher
                        })
                        
                        Project.objects.update_or_create(
                            id=group.id, 
                            sem=semester,
                            defaults={
                                "project_guide": Teacher.objects.get(user__username=assigned_teacher),
                                "domain": Domain.objects.get(name=assigned_domain)
                            }
                        )
                    else:
                        manual_allocations.append({
                            "group_id": project.id,
                            "domain": assigned_domain,
                            "teacher": assigned_teacher
                        })
                        Project.objects.update_or_create(
                            id=group.id, 
                            sem=semester,
                            defaults={
                                "project_guide": Teacher.objects.get(user__username=assigned_teacher),
                                "domain": Domain.objects.get(name=assigned_domain),
                                "final":1
                            }
                        )
            return Response({
                "automatic_allocations": automatic_allocations,
                "manual_allocations": manual_allocations
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

    
    @action(detail=False, methods=['get'], url_path='generate-excel')
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
            worksheet = workbook.add_worksheet('Guide Allocation Report')

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
            elements.append(Paragraph("<b><u>BE Project Weekly Report</u></b>", title_style))
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
            elements.append(Paragraph("<b><u>BE Project Weekly Report</u></b>", title_style))
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
            signature_text = """
            Signature:<br/><br/>
            Team Member 1: Prakruti Bhavsar<br/><br/>
            Team Member 2: Akanksha bhoir<br/><br/>
            Team Member 3: Payal Gupta<br/><br/>
            Team Member 4: Nimisha Idekar<br/><br/>
            Project Guide/Co-Guide Name: Prof. Vishal S. Badgujar      Prof. Seema Jadhav<br/><br/>
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

            frame = Frame(30, 50, 535, 690, id='normal') 

            template = PageTemplate(id='header_template', frames=frame, onPage=header)
            doc.addPageTemplates([template]) 

            elements =[]
            styles = getSampleStyleSheet()
            # ---- Front Page ----
            front_page_style = ParagraphStyle("FrontTitle", parent=styles["Title"], fontSize=12, alignment=1)  # Centered
            elements.append(Paragraph("BE Project Logbook", front_page_style))
            elements.append(Spacer(1, 30))  # Space below title

            elements.append(Paragraph("<b>Team Members:</b>", styles["Normal"]))
            elements.append(Paragraph("1. Student A<br/>2. Student B<br/>3. Student C<br/>4. Student D", styles["Normal"]))
            elements.append(Spacer(1, 20))  # Add space

            elements.append(Paragraph("<b>Project Title:</b> AI-Based Guide Allocation", styles["Normal"]))
            elements.append(Spacer(1, 50))  # Space before moving to next page
            elements.append(NextPageTemplate('header_template')) 
            elements.append(PageBreak())
              # Ensure next page starts new content

            # ---- Loop for Logbook Entries ----
            logbook_entries = [
                {"week": 1, "status": "Discussed project scope with guide."},
                {"week": 2, "status": "Finalized project requirements and documentation."},
                {"week": 3, "status": "Developed prototype and presented to guide."},
            ]
            for entry in logbook_entries: 
                elements.append(NextPageTemplate('header_template')) 
                # elements.append(PageBreak()) 
                elements.append(Paragraph(f"<b>Week {entry['week']}:</b>", styles["Normal"]))
                elements.append(Paragraph(entry["status"], styles["Normal"]))
                elements.append(Spacer(1, 20))  # Space between weeks
                elements.append(PageBreak()) 

            # Build PDF
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
    queryset = Domain.objects.all()  # Fetches all Domain objects
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

            cursem = ProjectGuide.objects.get(sem=semester,teacher=teacher)

            if cursem:
                cursem.form = 1
                cursem.save()

        return Response({"message": "Preferences saved successfully!"}, status=status.HTTP_201_CREATED)



    @action(detail=False, methods=['get'])
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
                teacher_name = f"Prof. {pref.teacher.user.first_name} {pref.teacher.user.last_name}"
                teacher_dict[pref.domain.name].append(teacher_name)

            return Response(teacher_dict)

        except Student.DoesNotExist:
            return Response({"error": "Student not found"}, status=404)
        

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
            phone = data.get("phone")
            batch_id = data.get("batch")  
            department = data.get("department")
            middle_name = data.get("middlename")

            if not all([username, first_name, last_name, email, batch_id]):
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

                    user = User.objects.create_user(username=username, email=email, password="Apsit@1234")
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
            required_columns = {"moodleId", "firstname", "lastname", "batch", "email", "phone", "middlename", "department"}
            missing_columns = required_columns - set(df.columns)

            if missing_columns:
                return Response({"error": f"Missing required columns: {missing_columns}"}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                for _, row in df.iterrows():
                    username = row["moodleId"]

                    if User.objects.filter(username=username).exists():
                        continue  # Skip existing users

                    user = User.objects.create_user(username=username, email=row["email"], password="default123")
                    user.first_name = row["firstname"]
                    user.last_name = row["lastname"]
                    user.save()

                    try:
                        dept = Department.objects.get(name=row["department"])
                        batch = Batch.objects.get(batch=row["batch"], department=dept)
                    except Batch.DoesNotExist:
                        raise IntegrityError(f"Invalid batch ID: {row['batch']}")  # Forces rollback
                    except Department.DoesNotExist:
                        raise IntegrityError(f"Invalid department: {row['department']}")  # Forces rollback

                    Student.objects.create(user=user, batch=batch, middle_name=row["middlename"])

            return Response({"message": "CSV file processed successfully!"}, status=status.HTTP_201_CREATED)

        except IntegrityError as ie:
            return Response({"error": str(ie)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": f"Processing failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=False, methods=["post"], url_path="register-sem-wise")    
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

class StudentSet(viewsets.ReadOnlyModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    permission_classes = [permissions.IsAuthenticated] 

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
    
    @action(detail=False, methods=['post'], url_path="sem-register")
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


            for teacher_data in selected_teachers:  # Extract availability
                teacher_id = teacher_data.get("id")
                availability_raw = teacher_data.get("availability", 0)
                user = User.objects.filter(username = teacher_id).first()
                teacher = Teacher.objects.filter(user=user).first()

                ProjectGuide.objects.update_or_create(
                    sem=semester, teacher=teacher, defaults={"availability": availability_raw}
                )
            return Response({"message": f"Teachers registered successfully"}, status=status.HTTP_201_CREATED)

        except Sem.DoesNotExist:
            return Response({"error": "Invalid semester ID"}, status=status.HTTP_400_BAD_REQUEST)
        except Teacher.DoesNotExist:
            return Response({"error": "Invalid teacher ID"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

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

                    user = User.objects.create_user(username=username, email=email, password="Apsit@1234")
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

                    user = User.objects.create_user(username=username, email=row["email"], password="Apsit@1234")
                    user.first_name = row["firstname"]
                    user.last_name = row["lastname"]
                    user.save()

                    try:
                        dept = Department.objects.get(name=row["department"])
                        desg = Designation.objects.get(name=row["designation"])
                    except Designation.DoesNotExist:
                        raise IntegrityError(f"Invalid batch ID: {row['designation']}")  # Forces rollback
                    except Department.DoesNotExist:
                        raise IntegrityError(f"Invalid department: {row['department']}")  # Forces rollback

                    Teacher.objects.create(user=user, role=desg, middle_name=row["middlename"], department=dept)

            return Response({"message": "CSV file processed successfully!"}, status=status.HTTP_201_CREATED)

        except IntegrityError as ie:
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
        department = Department.objects.get(name="Information Technology")
        years = Year.objects.filter(department=department).order_by("-id").values("id", "year")
        return Response(list(years))

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
    
    @action(detail=False, methods=["patch"], url_path="active-teacher-form")
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

            cursem = CurrentSem.objects.filter(student=student).order_by("-id").first()
            print(cursem)
            visibility = False
            project = None
            if cursem:
                if cursem.sem.student_form == 1 and cursem.form == 0 :
                    visibility = True
                elif cursem.sem.student_form == 1 and cursem.form == 1:
                    print("entered")
                    project = Project.objects.filter(
                        Q(sem=cursem.sem) & (Q(leader=student) | Q(members=student))
                    ).first()
            print(visibility)
            print(project)
            if project:
                serializer = ProjectSerializer(project)
                return Response({"status": visibility, "project": serializer.data}, status=status.HTTP_200_OK)
            else:
                return Response({"status": visibility, "project": None}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
    
    @action(detail=True, methods=['post'])
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
            project = Project.objects.get(pk=id)
            semester = project.sem
            weeks = Week.objects.filter(semester=semester).order_by('week_number')
            
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
            student_preferences = DomainPreference.objects.filter(project=project).order_by('rank')
            pref = {}
            for dp in student_preferences:
                guide_preferences = GuidePreference.objects.filter(preference=dp).order_by("rank")

                if dp.domain.name not in pref:
                    pref[dp.domain.name] = []

                pref[dp.domain.name].extend(get_full_name(gp.teacher) for gp in guide_preferences)
            return Response(pref,status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=500)
        
    @action(detail=False, methods=["post"])
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
        
        
        
        # print(group)
        # return Response({"message": "Group saved successfully"}, status=status.HTTP_200_OK)

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
    serializer_class = None

    @action(detail=True, methods=["get"], url_path="event_detail")
    def event_detail(self, request, pk=None):
        try:
            event = AssessmentEvent.objects.get(pk=pk)
            panels = AssessmentPanel.objects.filter(event=event).order_by("panel_number")
            serialized_panels = AssessmentPanelSerializer(panels, many=True).data

            # If needed, you can add event meta details as well
            return Response({
                "event": event.name,
                "panels": serialized_panels
            })

        except AssessmentEvent.DoesNotExist:
            return Response({"error": "Event not found."}, status=status.HTTP_404_NOT_FOUND)

class WeekViewSet(viewsets.ModelViewSet):
    queryset = Week.objects.all()
    serializer_class = WeekSerializer

    @action(detail=False, methods=['post'], url_path='add-weekly-tasks')
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

            predefined_tasks = {
                1: ["To participate in project orientation conducted by department.", "To discuss feasibility of project ideas proposed with guide.", "To present at least three topics as per the guidelines given by department."],
                2: ["To finalize project scope related to implementation.", "To ensure clear understanding of project background.","To decide technology stack on the basis of implementation scope."],
                3: ["To finalize and frame project objectives.","To ensure in-depth literature survey related to topic finalized addressing department guidelines.","To finalize project schedule of current semester taking into consideration department academic calendar."],
                4: ["To explore technology stack in depth based on objectives and scope decided.","To finalize project title reflecting objectives and technology stack.","To discuss roadmap regarding enablement related to technology stack decided with guide."],
                5: ["To discuss enablement and feasibility of publication on project idea proposed.","To participate in activities which department has planned related to collaborative project management & research publication.","To prepare and submit project proposal as per department guidelines to department."],
                6: ["To discuss and summarize literature review precisely if applicable.", "To discuss details of conferences and journals related to their project domain.","To discuss readiness related to progress review I scheduled as per Department Academic Calendar."],
                7: ["To orchestrate enablement about technology stack decided through small scale implementation.", "To discuss & finalize action plan for journals/Conferences publication on project idea."],
                8: ["To discuss feasibility of suggestion given in project review I.", "To ensure enablement related to project report preparation in latex.","To prepare research paper draft as per department guidelines."],
                9: ["To check plagiarism of research paper draft and reflect changes if required.","To get approval of guide for research paper draft prepared.","To discuss readiness regarding progress II presentation.","To get approval of project guide for presentation prepared for progress review II."],
                10: ["To discuss feasibility of suggestions given in progress review II.","To prepare & finalize report in latex for project phase I submission.","To submit report draft to guide for approval."],
                11: ["To submit project phase I report to department for signatures.","To discuss presentation prepared for external exam.","To showcase final small-scale orchestration of technology stack to guide before external exam."],
            }

            for week_num, tasks in predefined_tasks.items():
                week_obj, _ = Week.objects.get_or_create(
                    semester=semester, week_number=week_num
                )
                for idx, task_text in enumerate(tasks):
                    Task.objects.get_or_create(
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

class ProjectTaskViewSet(viewsets.ModelViewSet):
    queryset = ProjectTask.objects.all()
    serializer_class = ProjectTaskSerializer

    # Custom action to submit task statuses
    @action(detail=False, methods=['post'], url_path='submit-task-status')
    def submit_task_status(self, request):
        try:
            project_id = request.data.get('project_id')
            task_statuses = request.data.get('task_statuses')  # List of task data

            if not project_id or not task_statuses:
                return Response({'error': 'Project ID and task statuses are required'}, status=status.HTTP_400_BAD_REQUEST)
            
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
    def submit_logbook(self, request):
        try:
            project_id = request.data.get('project_id')
            week_id = request.data.get('week_id')
            task_statuses = request.data.get('task_statuses')  # List of task_id and details
            completion = request.data.get('completion_percentage')
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
                defaults={'completion_percentage': completion, 'remarks': remarks , "is_final":True}
            )

            return Response({'message': 'Task statuses and progress updated successfully'}, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)