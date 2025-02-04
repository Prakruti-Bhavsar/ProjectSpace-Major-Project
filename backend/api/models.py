from django.db import models
from django.contrib.auth.models import User
# Create your models here.

class Department(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'Department'

class Year(models.Model):
    id = models.AutoField(primary_key=True)
    year = models.CharField(max_length=50)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)

    class Meta:
        db_table = 'Academic Year'

class Student(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, primary_key=True)
    department = models.ForeignKey(Department, on_delete=models.SET_NULL, null=True)
    batch = models.CharField(max_length=50)
    middle_name = models.CharField(max_length=50, null=True)

    class Meta:
        db_table = "Student"
