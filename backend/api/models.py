from django.db import models
from django.contrib.auth.models import User
# Create your models here.

class Department(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)
    shortform = models.CharField(max_length=50,null=True)

    class Meta:
        db_table = 'Department'

class Designation(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'Designation'

class Year(models.Model):
    id = models.AutoField(primary_key=True)
    year = models.CharField(max_length=50)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'Academic Year'
        unique_together = ('department', 'year')

class Batch(models.Model):
    id = models.AutoField(primary_key=True)
    batch = models.CharField(max_length=50)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)

    class Meta:
            db_table = 'Academic Batch'


class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    batch = models.ForeignKey(Batch, on_delete=models.SET_NULL, null=True)
    middle_name = models.CharField(max_length=50, null=True)

    class Meta:
        db_table = "Student"

class Teacher(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL,null=True)
    role = models.ForeignKey(Designation, on_delete=models.SET_NULL, null=True)
    middle_name = models.CharField(max_length=50, null=True)
    experience = models.PositiveIntegerField(null=True)
    title = models.CharField(max_length=50, null=True)

    class Meta:
        db_table = "Teacher"


class Domain(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table = "Domain"

class TeacherPreference(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE)
    preference_rank = models.PositiveIntegerField() 

    class Meta:
        unique_together = ('teacher', 'preference_rank')  
        db_table = "TeacherPreference"

    def __str__(self):
        return f"{self.teacher.user.username} - {self.domain.name} (Preference {self.preference_rank})"

class Sem(models.Model):
    sem = models.CharField(max_length=50)
    div = models.CharField(max_length=50, null = True)
    year = models.ForeignKey(Year, on_delete=models.CASCADE)
    project_coordinator = models.ForeignKey(Teacher, on_delete=models.CASCADE, null = True,related_name='prj_coord')
    project_co_coordinator = models.ForeignKey(Teacher, on_delete=models.CASCADE, null = True,related_name='prj_co_ord')
    class_incharge = models.ForeignKey(Teacher, on_delete=models.CASCADE, null = True)
    student_form = models.IntegerField(default=0)
    teacher_form = models.IntegerField(default=0)
    tech = models.CharField(max_length=100,null = True)

    class Meta:
        db_table = 'sem'

class Project(models.Model):
    sem = models.ForeignKey(Sem, on_delete=models.CASCADE)
    div = models.CharField(max_length=50, null = True)
    group_no = models.CharField(max_length=20,null=True)
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE, null = True)
    leader = models.ForeignKey(Student,on_delete=models.CASCADE,null = True,related_name='leader_info')
    members = models.ManyToManyField(Student,related_name='member_info')
    project_guide = models.ForeignKey(Teacher, on_delete=models.CASCADE,null = True,related_name='prj_guide')
    project_co_guide = models.ForeignKey(Teacher, on_delete=models.CASCADE,null = True, related_name='prj_co_guide')
    final_topic = models.CharField(max_length=500,null = True)
    final_abstract = models.CharField(max_length=1000,null = True)
    final = models.IntegerField(default=0)
    class Meta:
        db_table = 'project'

class CurrentSem(models.Model):
    sem = models.ForeignKey(Sem, on_delete=models.CASCADE,null=True)
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    form = models.IntegerField(default = 0)

    class Meta:
        db_table = 'currentsem'

class Notification(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE,null=True)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE,null=True)
    msg = models.CharField(max_length=1000,null = True)
    sem = models.ForeignKey(Sem, on_delete=models.CASCADE,null=True)
    time = models.DateTimeField(auto_now_add=True)
    type = models.CharField(max_length=100,null = True)

    class Meta:
        db_table = 'notification'

class DomainPreference(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="preferences")
    domain = models.ForeignKey(Domain, on_delete=models.CASCADE, related_name="preferred_students")
    rank = models.IntegerField()  # 1 = First Choice, 2 = Second Choice, etc.

    class Meta:
        db_table = "domain_preference"
        unique_together = ("project", "domain")

class GuidePreference(models.Model):
    preference = models.ForeignKey(DomainPreference, on_delete=models.CASCADE, related_name="guide_preferences")
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name="preferred_students")
    rank = models.IntegerField()  # 1 = First Choice, 2 = Second Choice, etc.

    class Meta:
        db_table = "guide_preference"
        unique_together = ("preference", "teacher")

class MiniProjectGuidePreference(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="project_preferences")
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name="preferred_guide")
    rank = models.IntegerField()  # 1 = First Choice, 2 = Second Choice, etc.

    class Meta:
        db_table = "mini_guide_preference"
        
class ProjectGuide(models.Model):
    sem = models.ForeignKey(Sem, on_delete=models.CASCADE)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE,null=True)
    form = models.IntegerField(default = 0)
    availability = models.IntegerField(default=0)
    max_groups = models.IntegerField(default=0)

    class Meta:
        db_table = "ProjectGuide"

class Week(models.Model):
    SEMESTER_CHOICES = [
        ('sem_7', 'Semester 7'),
        ('sem_8', 'Semester 8'),
    ]
    semester = models.ForeignKey(Sem, related_name='weeks', on_delete=models.CASCADE)
    week_number = models.PositiveIntegerField()
    sem = models.CharField(max_length=5, choices=SEMESTER_CHOICES, null=True)
    
    def __str__(self):
        return f"Week {self.week_number} - {self.semester}"
    
    class Meta:
        db_table = "week"

class Task(models.Model):
    week = models.ForeignKey(Week, related_name='tasks', on_delete=models.CASCADE)
    task = models.CharField(max_length=255)
    sequence_number = models.PositiveIntegerField()  # Sequence number for task ordering

    class Meta:
        ordering = ['sequence_number']
        db_table = "task"

class Publication(models.Model):
    sem = models.ForeignKey(Sem,on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='publications')
    paper_name = models.CharField(max_length=255)
    conference_date = models.DateField()
    conference_name = models.CharField(max_length=255)

    def __str__(self):
        return self.paper_name
    
    class Meta:
        db_table = "Publication"


class Copyright(models.Model):
    sem = models.ForeignKey(Sem,on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='copyrights')
    project_title = models.CharField(max_length=255)
    filing_date = models.DateField()
    status = models.CharField(max_length=100)
    registration_number = models.CharField(max_length=100)

    def __str__(self):
        return self.project_title
    
    class Meta:
        db_table = "Copyright"


class Patent(models.Model):
    sem = models.ForeignKey(Sem,on_delete=models.CASCADE)
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='patents')
    project_title = models.CharField(max_length=255)
    filing_date = models.DateField()
    status = models.CharField(max_length=100)
    registration_number = models.CharField(max_length=100)

    def __str__(self):
        return self.project_title
    
    class Meta:
        db_table = "Patent"
    
class AssessmentEvent(models.Model):
    name = models.CharField(max_length=255)
    year = models.ForeignKey(Year, on_delete=models.CASCADE, related_name="events")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.year})"
    
    class Meta:
        db_table = "AssessmentEvent"

class AssessmentPanel(models.Model):
    event = models.ForeignKey(AssessmentEvent, on_delete=models.CASCADE, related_name="panels")
    panel_number = models.IntegerField()
    teachers = models.ManyToManyField(Teacher, related_name="assessment_panels")
    groups = models.ManyToManyField(Project, related_name="assigned_panels")

    def __str__(self):
        return f"Panel {self.panel_number} - {self.event.name}"
    
    class Meta:
        db_table = "AssessmentPanel"

class UnassignedTeacher(models.Model):
    event = models.ForeignKey(AssessmentEvent, on_delete=models.CASCADE, related_name="unassigned_teachers")
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.teacher.username} - {self.event.name}"
    
    class Meta:
        db_table = "UnassignedTeacher"


class UnassignedGroup(models.Model):
    event = models.ForeignKey(AssessmentEvent, on_delete=models.CASCADE, related_name="unassigned_groups")
    group = models.ForeignKey(Project, on_delete=models.CASCADE)

    def __str__(self):
        return f"{self.group.group_id} - {self.event.name}"
    
    class Meta:
        db_table = "UnassignedGroup"

class ProjectTask(models.Model):
    STATUS_CHOICES = [
        ('completed', 'Completed'),
        ('partially_completed', 'Partially Completed'),
        ('not_completed', 'Not Completed')
    ]
    
    project = models.ForeignKey(Project, related_name='tasks', on_delete=models.CASCADE)
    task = models.ForeignKey(Task, related_name='project_tasks', on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='not_completed')
    details = models.TextField(null=True, blank=True)  # Optional details for partially completed tasks
    date_submitted = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('project', 'task')
        db_table = "ProjectTask"

class ProjectWeekProgress(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE)
    week = models.ForeignKey(Week, on_delete=models.CASCADE)
    completion_percentage = models.PositiveIntegerField()
    remarks = models.TextField(null=True, blank=True)
    submitted_date = models.DateTimeField()
    submitted_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)  # assuming teachers log in
    is_final = models.BooleanField(default=False)  # prevents future edits

    class Meta:
        unique_together = ('project', 'week')  # One progress per project per week
        db_table = "ProjectWeekProgress"

class AssessmentRubric(models.Model):
    event = models.ForeignKey(AssessmentEvent, on_delete=models.CASCADE, related_name="rubrics")
    name = models.CharField(max_length=255)
    max_marks = models.PositiveIntegerField()

    def __str__(self):
        return f"{self.name} ({self.max_marks}) - {self.event.name}"
    
    class Meta:
        db_table = "AssessmentRubric"

class ProjectAssessment(models.Model):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='project_assessments')
    event = models.ForeignKey(AssessmentEvent, on_delete=models.CASCADE, related_name='project_assessments')
    remarks = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "ProjectAssessment"

class AssessmentMark(models.Model):
    project_assessment = models.ForeignKey(ProjectAssessment, on_delete=models.CASCADE, related_name='marks')
    rubric = models.ForeignKey(AssessmentRubric, on_delete=models.CASCADE)
    marks = models.PositiveIntegerField()

    class Meta:
        db_table = "AssessmentMark"

def upload_path(instance, filename):
    year = instance.semester.year.year.replace("/", "-")
    sem = instance.semester.id
    return f"uploads/{year}/{sem}/{filename}"

class Resource(models.Model):
    semester = models.ForeignKey(Sem, on_delete=models.CASCADE, related_name='uploads')
    name = models.CharField(max_length=255)
    file = models.FileField(upload_to=upload_path)

    class Meta:
        db_table = "Resource"

    def delete(self, *args, **kwargs):
        if self.file and self.file.name:
            self.file.delete(save=False)
        super().delete(*args, **kwargs)

class Link(models.Model):
    semester = models.ForeignKey(Sem, on_delete=models.CASCADE, related_name='links')
    name = models.CharField(max_length=255)
    link_type = models.CharField(max_length=30)

    def __str__(self):
        return f"{self.name} ({self.semester})"
    
    class Meta:
        db_table = "Link"

def upload_link_path(instance, filename):
    year = instance.project.sem.year.year.replace("/", "-")
    sem = instance.project.sem.id
    return f"link_uploads/{year}/{sem}/{filename}"

class LinkUpload(models.Model):
    link = models.ForeignKey(Link, on_delete=models.CASCADE, related_name='link_uploads')
    project = models.ForeignKey(Project,on_delete=models.CASCADE, related_name='project', null=True)
    title = models.CharField(max_length=255)
    file = models.FileField(upload_to=upload_link_path)

    def __str__(self):
        return f"{self.title} ({self.link.name})"
    
    class Meta:
        db_table = "LinkUpload"

class ManagementPermission(models.Model):
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE,null = True,related_name='access')

    class Meta:
        db_table = "ManagementPermission"