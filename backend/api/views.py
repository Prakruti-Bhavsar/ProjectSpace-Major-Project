from django.shortcuts import render
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from .serializers import *
from .models import *
from rest_framework.response import Response
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from knox.models import AuthToken

from sklearn.cluster import AgglomerativeClustering
from sklearn.manifold import TSNE
from sklearn.preprocessing import StandardScaler
from collections import defaultdict
import numpy as np

from functools import partial
from .genetic_algorithm import run_evolution, teachers, domains, groups, generate_population, fitness

from django.http import HttpResponse
from reportlab.lib.pagesizes import landscape, A4
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, PageTemplate, Frame
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.utils import ImageReader

import xlsxwriter
from io import BytesIO
import os
from django.conf import settings

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
                    }
                )
            else: 
                return Response({"error":"Invalid credentials"}, status=401)    
        else: 
            return Response(serializer.errors,status=400)

class ClusteringViewSet(viewsets.ModelViewSet):

    @action(detail=False, methods=['post'])
    def cluster_and_allocate(self, request):
        try:
            teachers = {
                "Prof. Snehal Patil": ["CyberSecurity", "AI-ML", "Blockchain", "IoT"],
                "Prof. Vinay Bhave": ["AI-ML", "Cloud Computing", "Blockchain", "DevOps"],
                "Prof. Shankar Jadhav": ["CyberSecurity", "Cloud Computing", "IoT"],
                "Prof. Neha Kotak": ["Big Data", "IoT"],
                "Prof. Kiran Rao": ["CyberSecurity", "Networking"],
                "Prof. Prerna Nair": ["Cloud Computing", "Networking", "IoT"],
                "Prof. Nia Kelkar": ["CyberSecurity", "Big Data", "DevOps"],
                "Prof. Shreya Jhnajar": ["AI-ML", "Big Data", "IoT"],
                "Prof.Priyal Snehi ": ["Cloud Computing", "Blockchain", "DevOps"],
            }
            groups = [
                {"Group": "Group1", "Domain": "CyberSecurity", "Guide": "Prof. Snehal Patil"},
                {"Group": "Group2", "Domain": "AI-ML", "Guide": "Prof. Vinay Bhave"},
                {"Group": "Group3", "Domain": "Cloud Computing", "Guide": "Prof. Shankar Jadhav"},
                {"Group": "Group4", "Domain": "Big Data", "Guide": "Prof. Neha Kotak"},
                {"Group": "Group5", "Domain": "Networking", "Guide": "Prof. Kiran Rao"},
                {"Group": "Group6", "Domain": "Cloud Computing", "Guide": "Prof. Prerna Nair"},
                {"Group": "Group7", "Domain": "Big Data", "Guide": "Prof. Neha Kotak"},
                {"Group": "Group8", "Domain": "Big Data", "Guide": "Prof. Nia Kelkar"},
                # {"Group": "Group9", "Domain": "Domain1", "Guide": "Teacher7"},

            ]
            domains = ["Cybersecurity", "AI-ML", "Cloud Computing", "Big Data", "Networking", "Blockchain", "DevOps", "IoT"]
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

            def enforce_teacher_limit(panels, max_teachers):
                """Ensure each panel has at most `max_teachers` teachers."""
                # Flatten panels into a list of assigned teachers
                assigned_teachers = {teacher for teachers in panels.values() for teacher in teachers}

                # Identify unassigned teachers
                unassigned_teachers = [teacher for teacher in teacher_names if teacher not in assigned_teachers]

                # Sort panels by size
                sorted_panels = sorted(panels.items(), key=lambda x: len(x[1]), reverse=True)

                # List of underpopulated panels
                underpopulated = [panel_id for panel_id, teachers in sorted_panels if len(teachers) < max_teachers]

                # Rebalance panels
                underpopulated = [panel_id for panel_id, teachers in sorted_panels if len(teachers) < max_teachers]
                for panel_id, teachers in sorted_panels:
                    while len(teachers) > max_teachers:
                        # Remove excess teacher and reassign to underpopulated panel
                        teacher_to_move = teachers.pop()
                        if underpopulated:
                            target_panel = underpopulated.pop(0)
                            panels[target_panel].append(teacher_to_move)
                            if len(panels[target_panel]) < max_teachers:
                                underpopulated.append(target_panel)

                for teacher in unassigned_teachers:
                    if underpopulated:
                        target_panel = underpopulated.pop(0)
                        panels[target_panel].append(teacher)
                        if len(panels[target_panel]) < max_teachers:
                            underpopulated.append(target_panel)

                return panels

            #Hierarchical Clustering
            hierarchical = AgglomerativeClustering(n_clusters=num_panels, linkage="average")
            hierarchical_labels = hierarchical.fit_predict(teacher_vectors_reduced)

            def form_panels(labels, teacher_names):
                panels = defaultdict(list)
                for idx, label in enumerate(labels):
                    panels[label].append(teacher_names[idx])
                return panels

            hierarchical_panels = form_panels(hierarchical_labels, teacher_names)
            hierarchical_panels_constrained = enforce_teacher_limit(hierarchical_panels, teachers_per_panel)

            #Group Allocation
            def groups_allocation(panel, groups, teachers):
                group_panel_assignment = defaultdict(list)
                unallocated_groups = []  # To track groups that couldn't be allocated in the first step

                # Determine equal allocation per panel
                total_groups = len(groups)
                num_panels = len(panel)
                groups_per_panel = total_groups // num_panels

                # Track the number of groups assigned to each panel
                panel_count = {panel_id: 0 for panel_id in panel}

                # Step 1: Primary allocation (Guide + Domain condition)
                for group in groups:
                    assigned = False
                    for panel_id, panel_teachers in panel.items():
                        # Check if the panel has not reached its group limit
                        if panel_count[panel_id] < groups_per_panel:
                            # Check if guide is in the panel
                            if group["Guide"] in panel_teachers:
                                # Check if another teacher (besides the guide) shares the domain
                                if any(teacher != group["Guide"] and group["Domain"] in teachers[teacher] for teacher in panel_teachers):
                                    group_panel_assignment[panel_id].append(group)
                                    panel_count[panel_id] += 1
                                    assigned = True
                                    break

                    if not assigned:
                        unallocated_groups.append(group)

                # Step 2: Secondary allocation for unallocated groups (Domain condition)
                still_unallocated = []
                for group in unallocated_groups:
                    assigned = False
                    for panel_id, panel_teachers in panel.items():
                        if panel_count[panel_id] < groups_per_panel:  # Check panel limit
                            if any(group["Domain"] in teachers[teacher] for teacher in panel_teachers):
                                group_panel_assignment[panel_id].append(group)
                                panel_count[panel_id] += 1
                                assigned = True
                                break  # Stop checking after assigning

                    if not assigned:
                        still_unallocated.append(group)

                return group_panel_assignment, still_unallocated

            hierarchical_groups_allocation, remaining_groups = groups_allocation(hierarchical_panels_constrained, groups, teachers)

            response_data = {
                "panels": {
                    f"Panel {panel_id + 1}": panel_teachers
                    for panel_id, panel_teachers in hierarchical_panels_constrained.items()
                },
                "groups": {
                    f"Panel {panel_id + 1}": [
                        {"Group": g["Group"], "Domain": g["Domain"], "Guide": g["Guide"]}
                        for g in hierarchical_groups_allocation.get(panel_id, [])
                    ]
                    for panel_id in hierarchical_panels_constrained.keys()
                },
                "remaining_groups": remaining_groups,
            }
            return Response(response_data, status=200)

        except Exception as e:
            print("Error during clustering and allocation:", e)
            return Response({"error": str(e)}, status=400)


class GuideAllocationViewSet(viewsets.ViewSet):

    @action(detail=False, methods=['get'])
    def allocate_guides(self, request):
        """
        API endpoint to allocate guides using the genetic algorithm.
        """
        population, generations = run_evolution(
            populate_func=partial(generate_population, size=10),
            fitness_func=fitness,
            fitness_limit=5,
            generation_limit=100
        )

        best_solution = population[0]
        allocation_results = [
            {"group_id": groups[i].id, "domain": domains[d], "teacher": teachers[t].name}
            for i, (d, t) in enumerate(best_solution)
        ]

        return Response({"generations": generations, "allocations": allocation_results})

class CustomModelViewSet(viewsets.ModelViewSet):
    # Your ModelViewSet code here...

    def header(canvas, doc):
        try:
            image_path = os.path.join(settings.BASE_DIR, 'images', 'image.png')  # Ensure correct image path
            canvas.drawImage(image_path, 30, 750, width=530, height=80)  # Adjust dimensions as needed

            canvas.setFont("Helvetica", 10)

            canvas.drawString(50, 725, "Class/Division: BE IT- A & B")
            canvas.drawString(450, 725, "Sem: VII")
            canvas.drawString(450, 710, "Academic Year: 2024-25")

            canvas.line(30, 700, 550, 700)
            canvas.showPage()  # Ensure the page is properly initiated
        except Exception as e:
            print(f"Error in header function: {e}")

    @action(detail=False, methods=['get'], url_path='generate-pdf')
    def generate_pdf(self, request):
        try:
            def header(canvas, doc):
                try:
                    image_path = os.path.join(settings.BASE_DIR, 'images', 'image.png')  # Ensure correct image path
                    canvas.drawImage(image_path, 30, 750, width=530, height=80)  # Adjust dimensions as needed

                    canvas.setFont("Helvetica", 10)

                    canvas.drawString(40, 725, "Class/Division: BE IT- A & B")
                    canvas.drawString(280, 725, "Sem: VII")
                    canvas.drawString(450, 725, "Academic Year: 2024-25")

                    canvas.line(30, 710, 570, 710)
                    # canvas.showPage()  # Ensure the page is properly initiated
                except Exception as e:
                    print(f"Error in header function: {e}")

            # Create an HTTP response with PDF content type
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = 'inline; filename="guide_allocation.pdf"'

            # Define the PDF document
            doc = SimpleDocTemplate(response, pagesize=A4)

            frame = Frame(30, 50, 530, 630, id='normal')  # Leave space for header

            # Apply the header function to each page
            template = PageTemplate(id='header_template', frames=frame, onPage=header)
            doc.addPageTemplates([template])

            # if not callable(header):
            #     return HttpResponse("Error: header function is not defined", status=500)

            # Create a list to hold elements for the PDF
            elements = []

            # Sample styles
            styles = getSampleStyleSheet()
            title_style = styles["Title"]

            # Title
            elements.append(Paragraph("Guide Allocation Report", title_style))
            elements.append(Spacer(1, 12))  # Add some space below the title

            # Table Data
            data = [
                ["Sr. No.", "Group Number", "Moodle ID", "Name of the Student", "Project Guide & Co-Guide"],
                ["1", "A1", "21104060\n21104067\n21104050\n21104052", 
                "Siddharth Rao\nYash Deshpande\nYatish Kelriwal\nYuvraj More", "Mr. Vinay Bhave"],
                ["2", "A2", "21104061\n21104063\n21104051", 
                "Shruti Jain\n Sonal Shinde\n Samiksha Deo", 
                "Ms. Shankar Jadhav\nMs. Neha Kotak"],
                ["3", "A3", "21104053\n21104062\n21104065", 
                "Aryan Singh\nSushant Shetty\nAlok Nair", 
                "Ms. Kiran Rao"],
                ["4", "A4", "21104064\n21104066\n21104068", 
                "Raghav Mehra\nPriyal Jain\nNeera Nazia", 
                "Ms. Snehal Patil"],

                # Add more rows as needed
            ]

            # Create a Table
            table = Table(data, colWidths=[50, 80, 100, 130, 150, 100])

            # Style the Table
            table.setStyle(TableStyle([
                # ('BACKGROUND', (0, 0), (-1, 0), colors.grey),  # Header row background
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),  # Header text color
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),  # Center align all cells
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),  # Bold font for header row
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),  # Add padding to header
                # ('BACKGROUND', (0, 1), (-1, -1), colors.beige),  # Body rows background
                ('GRID', (0, 0), (-1, -1), 1, colors.black),  # Add grid lines
            ]))

            # Add the table to elements
            elements.append(table)

            elements.append(Spacer(1, 200))

            footer = [
                ["Mr. Sachin Kasare", "Mr. Vishal Badgujar", "Ms. Sonal Balpande", "Dr. Kiran Deshpande"],
                ["(Project Co-Coordinator)", "(Project Co-ordinator)", "(Class In-charge)", "(HOD, Information Technology)"],
            ]

            num_cols = len(footer[0])
            # total_width = 200
            # col_widths = [total_width / num_columns] * num_columns
            # print(col_widths)
            table1 = Table(footer, colWidths=[150,150,150,150])

            table1.setStyle(TableStyle([
                # ('BACKGROUND', (0, 0), (-1, 0), colors.grey),  # Header row background
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.black),  # Header text color
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),  # Center align all cells
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),  # Bold font for header row
                # ('BOTTOMPADDING', (0, 0), (-1, 0), 10),  # Add padding to header
                # ('BACKGROUND', (0, 1), (-1, -1), colors.beige),  # Body rows background
                # ('GRID', (0, 0), (-1, -1), 1, colors.black),  # Add grid lines
            ]))

            elements.append(table1)


            # try:
            #     doc.build(elements, onFirstPage=header, onLaterPages=header)
            # except Exception as e:
            #     return HttpResponse(f"Error while building PDF: {e}", status=500)

            doc.build(elements)

            return response
        except Exception as e:
            return HttpResponse(f"Error generating PDF: {e}", status=500)
    
    @action(detail=False, methods=['get'], url_path='generate-excel')
    def generate_excel(self, request):
        try:
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
            # Merge Cells for Titles & Subtitles
            worksheet.merge_range('A6:F6', "Guide Allocation", title_format)
            worksheet.merge_range('A7:F7', "Academic Year: 2024-25", subtitle_format)

            # Define column widths
            worksheet.set_column('A:A', 6)  # Sr. No.
            worksheet.set_column('B:B', 15)  # Group Number
            worksheet.set_column('C:C', 15)  # Roll Number
            worksheet.set_column('D:D', 30)  # Moodle ID
            worksheet.set_column('E:E', 40)  # Name of the Student
            worksheet.set_column('F:F', 40)  # Project Guide & Co-Guide

            # Write the header
            headers = ["Sr. No.", "Group Number", "Roll Number", "Moodle ID", "Name of the Student", "Project Guide & Co-Guide"]
            for col_num, header in enumerate(headers):
                worksheet.write(8, col_num, header, header_format)  # Start header at row 9 (index 8)

            # Sample structured data (Each group has multiple students)
            data = [
                [1, "A1", ["42", "32", "10", "9"], 
                ["21104060", "21104067", "21104050", "21104052"],
                ["Siddharth Rao", "Yash Deshpande", "Yatish Kelriwal", "Yuvraj More",], 
                "Mr. Vinay Bhave"],

                [2, "A2", ["41", "43", "06"], 
                ["21104061", "21104063", "21104051"], 
                ["Shruti Jain", "Sonal Shinde", "Samiksha Deo"], 
                "Ms. Shankar Jadhav\nMs. Neha Kotak"]
            ]

            row = 9  # Start writing data from row 10
            for sr_no, group, roll_numbers, moodle_ids, students, guide in data:
                group_size = len(students)  # Number of students in this group
                
                # Merge Sr. No., Group Number, and Project Guide columns for the whole group
                if group_size > 1:
                    worksheet.merge_range(row, 0, row + group_size - 1, 0, sr_no, merged_cell_format)  # Sr. No.
                    worksheet.merge_range(row, 1, row + group_size - 1, 1, group, merged_cell_format)  # Group Number
                    worksheet.merge_range(row, 5, row + group_size - 1, 5, guide, merged_guide_format)  # Project Guide # Project Guide

                for i in range(group_size):
                    worksheet.write(row, 2, roll_numbers[i], cell_format)  # Roll Number
                    worksheet.write(row, 3, moodle_ids[i], cell_format)  # Moodle ID
                    worksheet.write(row, 4, students[i], cell_format)  # Student Name
                    row += 1  # Move to next row

            # Determine footer row (10 rows below the last row of the table)
            footer_row = row + 10  

            footer_format = workbook.add_format({
                'bold': True,
                'align': 'justify',  # Justifies the text within the merged cell
                'valign': 'vcenter',
                'text_wrap': True  # Enables multi-line text wrapping
            })

            # Merge cells and write the footer text
            # footer_text = (
            #     "Mr. Sachin Kasare \n (Project Co-Coordinator)   "
            #     "Mr. Vishal Badgujar \n (Project Co-ordinator)   "
            #     "Ms. Sonal Balpande \n (Class In-charge)   "
            #     "Dr. Kiran Deshpande \n (HOD, Information Technology)"
            # )

            # worksheet.merge_range(footer_row, 0, footer_row, 3, 
            #           "Mr. Sachin Kasare \n(Project Co-Coordinator)\n"
            #           "Mr. Vishal Badgujar \n(Project Co-ordinator)\n"
            #           "Ms. Sonal Balpande \n(Class In-charge)\n"
            #           "Dr. Kiran Deshpande \n(HOD, Information Technology)", footer_format)

            # worksheet.merge_range(footer_row, 0, footer_row, 3,
            #           "Mr. Sachin Kasare\n(Project Co-Coordinator)\n"
            #           "Mr. Vishal Badgujar\n(Project Co-ordinator)\n"
            #           "Ms. Sonal Balpande\n(Class In-charge)\n"
            #           "Dr. Kiran Deshpande\n(HOD, Information Technology)", footer_format)

            worksheet.set_column('A:D', 25)

            # # Write footer text in separate columns for proper alignment
            worksheet.write(footer_row, 0, "Mr. Sachin Kasare\n(Project Co-Coordinator)", footer_format)
            worksheet.write(footer_row, 1, "Mr. Vishal Badgujar\n(Project Co-ordinator)", footer_format)
            worksheet.write(footer_row, 2, "Ms. Sonal Balpande\n(Class In-charge)", footer_format)
            worksheet.write(footer_row, 3, "Dr. Kiran Deshpande\n(HOD, Information Technology)", footer_format)

            # Define footer format with text wrapping and custom alignment
            # footer_format = workbook.add_format({
            #     'bold': True,
            #     'align': 'center',  # Center-align the text
            #     'valign': 'vcenter',  # Vertically center the text
            #     'text_wrap': True  # Enable text wrapping
            # })

            # Define footer row (10 rows below the last row of the table)
            # footer_row = row + 10  

            # Merge the cells horizontally for each person, leaving space between them
            # worksheet.merge_range(footer_row, 0, footer_row, 1, "Mr. Sachin Kasare\n(Project Co-Coordinator)", footer_format)  # Name and title
            # worksheet.merge_range(footer_row, 2, footer_row, 3, "Mr. Vishal Badgujar\n(Project Co-ordinator)", footer_format)  # Name and title
            # worksheet.merge_range(footer_row, 4, footer_row, 5, "Ms. Sonal Balpande\n(Class In-charge)", footer_format)  # Name and title
            # worksheet.merge_range(footer_row, 6, footer_row, 7, "Dr. Kiran Deshpande\n(HOD, Information Technology)", footer_format)  # Name and title

            

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
    # def generate_excel(self, request):
    #     try:
    #         # Create an in-memory output file for the workbook.
    #         output = BytesIO()

    #         # Create an Excel workbook and worksheet
    #         workbook = xlsxwriter.Workbook(output, {'in_memory': True})
    #         worksheet = workbook.add_worksheet('Guide Allocation Report')

    #         # Define formats
    #         header_format = workbook.add_format({
    #             'bold': True,
    #             'bg_color': '#D3D3D3',
    #             'border': 1,
    #             'align': 'center',
    #             'valign': 'vcenter'
    #         })

    #         cell_format = workbook.add_format({
    #             'border': 1,
    #             'align': 'left',
    #             'valign': 'vcenter'
    #         })

    #         # Define column widths
    #         worksheet.set_column('A:A', 10)  # Sr. No.
    #         worksheet.set_column('B:B', 15)  # Group Number
    #         worksheet.set_column('C:C', 25)  # Moodle ID
    #         worksheet.set_column('D:D', 40)  # Name of the Student
    #         worksheet.set_column('E:E', 30)  # Project Guide & Co-Guide

    #         # Write the header
    #         headers = ["Sr. No.", "Group Number", "Moodle ID", "Name of the Student", "Project Guide & Co-Guide"]
    #         for col_num, header in enumerate(headers):
    #             worksheet.write(0, col_num, header, header_format)

    #         # Sample data
    #         data = [
    #             [1, "A1", "21104060, 21104067, 21104050, 21104052",
    #              "Siddharth Rao, Yash Deshpande, Yatish Kelriwal, Yuvraj More", "Mr. Vinay Bhave"],
    #             [2, "A2", "21104061, 21104063, 21104051",
    #              "Shruti Jain, Sonal Shinde, Samiksha Deo", "Ms. Shankar Jadhav\nMs. Neha Kotak"],
    #             [3, "A3", "21104053, 21104062, 21104065",
    #              "Aryan Singh, Sushant Shetty, Alok Nair", "Ms. Kiran Rao"],
    #             [4, "A4", "21104064, 21104066, 21104068",
    #              "Raghav Mehra, Priyal Jain, Neera Nazia", "Ms. Snehal Patil"]
    #         ]

    #         # Write the data rows
    #         for row_num, row_data in enumerate(data, start=1):
    #             for col_num, cell_data in enumerate(row_data):
    #                 worksheet.write(row_num, col_num, cell_data, cell_format)

    #         # Close the workbook
    #         workbook.close()

    #         # Prepare the HTTP response
    #         output.seek(0)
    #         response = HttpResponse(
    #             output,
    #             content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    #         )
    #         response['Content-Disposition'] = 'attachment; filename="guide_allocation.xlsx"'
    #         return response