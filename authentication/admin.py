from django.contrib import admin
from .models import Utilisateur, OTPCode

admin.site.register(Utilisateur)
admin.site.register(OTPCode)