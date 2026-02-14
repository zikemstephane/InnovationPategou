import { Pipe, PipeTransform } from '@angular/core';

/**
 * Un pipe qui transforme une chaîne de caractères de date en une chaîne
 * indiquant le temps écoulé depuis cette date (ex: "il y a 5 minutes").
 */
@Pipe({
  name: 'timeAgo',
  standalone: true
})
export class TimeAgoPipe implements PipeTransform {

  /**
   * Transforme une chaîne de caractères de date en une chaîne de temps relatif.
   * @param value La chaîne de caractères représentant la date (généralement au format ISO 8601).
   * @returns Une chaîne de caractères décrivant le temps écoulé (ex: "il y a 5 minutes").
   */
  transform(value: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    const now = new Date();
    const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

    // Gérer le cas où la date est dans le futur
    if (seconds < 0) {
      return 'dans un instant';
    }

    if (seconds < 60) {
      return `il y a ${seconds} seconde${seconds > 1 ? 's' : ''}`;
    }

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) {
      return `il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }

    const hours = Math.floor(minutes / 60);
    if (hours < 24) {
      return `il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    }

    const days = Math.floor(hours / 24);
    if (days < 7) {
      return `il y a ${days} jour${days > 1 ? 's' : ''}`;
    }
    
    const weeks = Math.floor(days / 7);
    if (weeks < 4) {
      return `il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
    }
    
    const months = Math.floor(days / 30.44); // Approximation moyenne pour un mois
    if (months < 12) {
      return `il y a ${months} mois`;
    }

    // Si la date est très ancienne, on retourne la date formatée
    return date.toLocaleDateString();
  }
}