import threading
from django.core.mail import send_mail

def envoyer_code_otp_asynchrone(user_email, user_prenom, code):
    """
    Envoie l'email de manière asynchrone (non bloquante).
    Cela empêche le timeout du worker sur Render.
    """
    def _tache_envoi():
        try:
            send_mail(
                subject="Code de vérification pour votre connexion",
                message=f"""
                Bonjour {user_prenom},

                Nous avons reçu une demande de connexion à votre compte.
                Pour continuer et valider votre identité, voici votre code de sécurité :

                {code}

                Ce code est valide pendant 10 minutes.

                Si vous n'êtes pas à l'origine de cette demande, ignorez cet e-mail.

                Cordialement,
                L'équipe de Pategou
                """,
                from_email="no-reply@monapp.com", # Assurez-vous que c'est cohérent avec votre config SMTP
                recipient_list=[user_email],
                fail_silently=True, # Important pour ne pas planter en cas d'erreur SMTP légère
            )
            print(f"--- SUCCES EMAIL --- Envoyé à {user_email}")
        except Exception as e:
            print(f"--- ERREUR EMAIL --- {e}")

    # Lancer l'envoi dans un thread séparé
    thread = threading.Thread(target=_tache_envoi)
    thread.start()