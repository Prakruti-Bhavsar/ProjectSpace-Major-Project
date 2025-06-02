from rest_framework import serializers
from .models import *
from django.contrib.auth.models import User

class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret.pop('password', None)
        return ret

class SetPasswordSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

class DomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = Domain
        fields = ['id', 'name'] 

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = '__all__'

class TeacherPreferenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = TeacherPreference
        fields = ['teacher', 'domain', 'preference_rank']

class BatchSerializer(serializers.ModelSerializer):
    department = serializers.CharField(source="department.name", read_only=True)

    class Meta:
        model = Batch
        fields = ["id", "batch", "department"]
    
class StudentSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="user.id", read_only=True)
    moodleid = serializers.CharField(source="user.username", read_only=True)
    first_name = serializers.CharField(source="user.first_name", required=False)
    last_name = serializers.CharField(source="user.last_name", required=False)
    batch = serializers.CharField(source="batch.batch", read_only=True)  # Batch name
    department = serializers.CharField(source="batch.department.name", read_only=True)  # Department name
    email = serializers.EmailField(source="user.email", required=False)
    middle_name = serializers.SerializerMethodField(required=False)

    def get_middle_name(self, obj):
        return obj.middle_name if obj.middle_name and obj.middle_name != "nan" else " "

    class Meta:
        model = Student
        fields = ["id","moodleid", "first_name", "middle_name", "last_name", "department", "batch", "email"]


from rest_framework import serializers
from .models import Teacher

class TeacherSerializer(serializers.ModelSerializer):
    id = serializers.CharField(source="user.id", read_only=True)
    moodleid = serializers.CharField(source="user.username", read_only=True)
    first_name = serializers.CharField(source="user.first_name", read_only=True)
    last_name = serializers.CharField(source="user.last_name", read_only=True)
    department = serializers.CharField(source="department.name", read_only=True)
    role = serializers.CharField(source="role.name", read_only=True)  # Assuming Designation has a 'name' field
    email = serializers.EmailField(source="user.email", read_only=True)
    middle_name = serializers.SerializerMethodField()

    def get_middle_name(self, obj):
        return obj.middle_name if obj.middle_name and obj.middle_name != "nan" else ""

    class Meta:
        model = Teacher
        fields = ["id", "moodleid", "first_name", "middle_name", "last_name", "department", "role", "experience", "email", "title"]

    def update(self, instance, validated_data):
        user_data = validated_data.pop("user", {})

        # Update fields on User model
        user = instance.user
        user.first_name = user_data.get("first_name", user.first_name)
        user.last_name = user_data.get("last_name", user.last_name)
        user.email = user_data.get("email", user.email)
        user.save()

        # Update fields on Student model
        instance.middle_name = validated_data.get("middle_name", instance.middle_name)
        instance.save()

        return instance

class ManagementPermissionSerializer(serializers.ModelSerializer):
    teacher = TeacherSerializer(read_only=True)
    teacher_id = serializers.PrimaryKeyRelatedField(
        queryset=Teacher.objects.all(), source='teacher', write_only=True
    )

    class Meta:
        model = ManagementPermission
        fields = ['id', 'teacher', 'teacher_id']

class YearSerializer(serializers.ModelSerializer):
    department = serializers.CharField(source="department.name")  # Get department name

    class Meta:
        model = Year
        fields = ["year", "department"]

class YearSerializer(serializers.ModelSerializer):
    department = serializers.CharField(source="department.name")  # Get department name

    class Meta:
        model = Year
        fields = ["year", "department"]

class SemSerializer(serializers.ModelSerializer):
    project_coordinator_name = serializers.SerializerMethodField()
    project_co_coordinator_name = serializers.SerializerMethodField()
    class_incharge_name = serializers.SerializerMethodField()
    class Meta:
        model = Sem
        fields = "__all__" 
    def get_project_coordinator_name(self, obj):
        return self.get_teacher_name(obj.project_coordinator)

    def get_project_co_coordinator_name(self, obj):
        return self.get_teacher_name(obj.project_co_coordinator)

    def get_class_incharge_name(self, obj):
        return self.get_teacher_name(obj.class_incharge)

    def get_teacher_name(self, teacher):
        if teacher and teacher.user:
            return f"{teacher.user.first_name} {teacher.middle_name or ''} {teacher.user.last_name}".strip()

class ProjectSerializer(serializers.ModelSerializer):
    sem = serializers.CharField(source="sem.sem", read_only=True)  # Semester name
    div = serializers.CharField(required=False, allow_null=True)  # Division name
    domain = serializers.CharField(source="domain.name", read_only=True)
    year = serializers.CharField(source="sem.year.year", read_only=True)
    leader_name = serializers.SerializerMethodField()  # Leader's full name
    project_guide_name = serializers.SerializerMethodField()  # Guide's full name
    project_co_guide_name = serializers.SerializerMethodField()  # Co-Guide's full name
    members = serializers.SerializerMethodField()  # List of members' full names

    class Meta:
        model = Project
        fields = [
            "id",
            "sem",
            "div",
            "group_no",
            "domain",
            "leader_name",
            "members",
            "project_guide_name",
            "project_co_guide_name",
            "final_topic",
            "final_abstract",
            "final",
            "year",
        ]

    def get_leader_name(self, obj):
        if obj.leader:
            return f"{obj.leader.user.first_name} {obj.leader.middle_name or ''} {obj.leader.user.last_name}".strip()
        return "N/A"

    def get_project_guide_name(self, obj):
        if obj.project_guide:
            return f"{obj.project_guide.user.first_name} {obj.project_guide.middle_name or ''} {obj.project_guide.user.last_name}".strip()
        return "N/A"

    def get_project_co_guide_name(self, obj):
        if obj.project_co_guide:
            return f"{obj.project_co_guide.user.first_name} {obj.project_co_guide.middle_name or ''} {obj.project_co_guide.user.last_name}".strip()
        return "N/A"

    def get_members(self, obj):
        return [
            f"{student.user.first_name} {student.middle_name or ''} {student.user.last_name}".strip()
            for student in obj.members.all()
        ]

class PublicationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Publication
        fields = ['id', 'sem', 'project', 'paper_name', 'conference_date', 'conference_name']

class CopyrightSerializer(serializers.ModelSerializer):
    class Meta:
        model = Copyright
        fields = ['id', 'sem', 'project', 'project_title', 'filing_date', 'status', 'registration_number']

class PatentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Patent
        fields = ['id', 'sem', 'project', 'project_title', 'filing_date', 'status', 'registration_number']

class AssessmentPanelSerializer(serializers.ModelSerializer):
    panels = serializers.SerializerMethodField()
    groups = serializers.SerializerMethodField()

    class Meta:
        model = AssessmentPanel
        fields = ['panel_number', 'panels', 'groups']

    def get_panels(self, obj):
        return [f"{teacher.user.first_name} {teacher.middle_name or ''} {teacher.user.last_name}".strip() for teacher in obj.teachers.all()]

    def get_groups(self, obj):
        return [
            {   
                "id":group.id,
                "Group": group.group_no or f"{group.div}{group.id}",  # Replace with your actual Project field
                "Domain": group.domain.name if group.domain else "",
                "Guide": f"{group.project_guide.user.first_name} {group.project_guide.middle_name or ''} {group.project_guide.user.last_name}".strip() if group.project_guide and hasattr(group.project_guide, 'user') else "N/A",
                "Co-Guide": f"{group.project_co_guide.user.first_name} {group.project_co_guide.middle_name or ''} {group.project_co_guide.user.last_name}".strip() if group.project_co_guide and hasattr(group.project_co_guide, 'user') else ""
            }
            for group in obj.groups.all()
        ]

class AssessmentEventDetailSerializer(serializers.ModelSerializer):

    class Meta:
        model = AssessmentEvent
        fields = ['id', 'name', 'year']

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = '__all__'

class WeekSerializer(serializers.ModelSerializer):
    tasks = TaskSerializer(many=True, read_only=True)

    class Meta:
        model = Week
        fields = '__all__'

class ProjectTaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectTask
        fields = ['id', 'project', 'task', 'status', 'details', 'date_submitted']

class StudentProfileSerializer(serializers.ModelSerializer):
    # Read from User model via the related user field
    moodleid = serializers.CharField(source="user.username", read_only=True)
    first_name = serializers.CharField(source='user.first_name')
    last_name = serializers.CharField(source='user.last_name')
    email = serializers.EmailField(source='user.email')
    department = serializers.CharField(source="batch.department.name", read_only=True)  # Department name
    # Fields from the Student model
    middle_name = serializers.CharField()
    batch = serializers.StringRelatedField()  # Or another method to display Batch details

    class Meta:
        model = Student
        fields = [
            'moodleid',
            'first_name',
            'last_name',
            'email',
            'middle_name',
            'batch',
            'department',
        ]

class AssessmentRubricSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentRubric
        fields = ['id', 'name', 'max_marks']

class AssessmentMarkSerializer(serializers.ModelSerializer):
    class Meta:
        model = AssessmentMark
        fields = ['rubric', 'marks']

class ProjectAssessmentSerializer(serializers.ModelSerializer):
    marks = AssessmentMarkSerializer(many=True, write_only=True)

    class Meta:
        model = ProjectAssessment
        fields = ['id','project', 'event', 'remarks', 'marks']
    
    def create(self, validated_data):
        marks_data = validated_data.pop('marks')
        project_assessment = ProjectAssessment.objects.create(**validated_data)
        for mark in marks_data:
            AssessmentMark.objects.create(project_assessment=project_assessment, **mark)
        return project_assessment

class ResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resource
        fields = ['id', 'semester', 'name', 'file']

class LinkSerializer(serializers.ModelSerializer):
    total_uploads = serializers.IntegerField(read_only=True)

    class Meta:
        model = Link
        fields = ['id', 'name', 'link_type', 'semester', 'total_uploads']

class LinkUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = LinkUpload
        fields = '__all__'