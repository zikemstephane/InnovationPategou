
import re
from django.conf import settings
from django.shortcuts import redirect


from pategou.settings import PUBLIC_URLS
class LoginRequiredMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Si l'utilisateur n'est pas connecté
        if not request.user.is_authenticated:
            # On vérifie si l'URL actuelle est publique
            path = request.path_info
            if not any(match.match(path) for match in [re.compile(url) for url in PUBLIC_URLS]):
                # Rediriger vers la page de login (ou renvoyer 401 pour API)
                return redirect('api/auth/login/') 
        
        response = self.get_response(request)
        return response