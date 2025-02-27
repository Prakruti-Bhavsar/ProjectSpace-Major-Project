from django.contrib.auth.models import User

class UserAuthBackend: 
    def authenticate(self, request, username=None, password=None):
        try: 
            user = User.objects.get(username=username)
            if user.check_password(password): 
                return user 
        except User.DoesNotExist:
            return None
        
    def get_user(self, user_id): 
        try: 
            return User.objects.get(pk=user_id)
        except User.DoesNotExist: 
            return None