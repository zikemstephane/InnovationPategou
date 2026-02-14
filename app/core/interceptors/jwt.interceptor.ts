// interceptors/auth.interceptor.ts

import { inject } from '@angular/core';
import { HttpInterceptorFn } from '@angular/common/http';
import { Auth } from 'src/app/infrastructure/services/auth/auth';

/**
 * Intercepteur HTTP fonctionnel pour ajouter le token JWT à chaque requête sortante.
 * 
 * @param req La requête HTTP sortante.
 * @param next Le prochain handler dans la chaîne d'intercepteurs.
 * @returns Un Observable qui émet la réponse du serveur.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    // 1. Injecter le service AuthService en utilisant la fonction `inject()`
    //    C'est l'équivalent fonctionnel de l'injection par constructeur.
    const authService = inject(Auth);
    
    // 2. Récupérer le token JWT depuis le service
    const token = authService.getToken();

    // 3. Si un token existe, cloner la requête pour y ajouter l'en-tête d'autorisation.
    if (token) {
        // On clone la requête pour ne pas modifier l'originale, ce qui est une bonne pratique.
        const authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
        
        // 4. Passer la requête modifiée au handler suivant.
        return next(authReq);
    }

    // 5. S'il n'y a pas de token, passer la requête originale sans modification.
    return next(req);
};