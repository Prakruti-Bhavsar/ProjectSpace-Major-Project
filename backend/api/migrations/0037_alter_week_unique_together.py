# Generated by Django 5.1.4 on 2025-04-24 17:22

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0036_alter_week_unique_together'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='week',
            unique_together=set(),
        ),
    ]
