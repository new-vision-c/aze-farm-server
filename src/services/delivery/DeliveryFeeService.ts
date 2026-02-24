import logger from '@/services/logging/logger';

/**
 * Configuration des frais de livraison par zone
 */
export const DELIVERY_FEES = {
  // Frais de base
  BASE_FEE: 1000, // 1000 FCFA frais de base

  // Frais par distance (km)
  DISTANCE_FEES: {
    '0-5': 500, // 0-5km: 500 FCFA
    '5-10': 800, // 5-10km: 800 FCFA
    '10-20': 1200, // 10-20km: 1200 FCFA
    '20-50': 2000, // 20-50km: 2000 FCFA
    '50+': 3000, // 50km+: 3000 FCFA
  },

  // Frais par poids (kg)
  WEIGHT_FEES: {
    '0-2': 0, // 0-2kg: gratuit
    '2-5': 300, // 2-5kg: 300 FCFA
    '5-10': 600, // 5-10kg: 600 FCFA
    '10-20': 1000, // 10-20kg: 1000 FCFA
    '20+': 1500, // 20kg+: 1500 FCFA
  },

  // Types de livraison
  DELIVERY_TYPES: {
    PICKUP: 0, // Ramassage gratuit
    DELIVERY: 0, // Livraison normale (frais calculés)
    MARKET: 500, // Marché (frais fixe réduit)
  },

  // Zones spéciales (frais supplémentaires)
  SPECIAL_ZONES: {
    // Liste des communes avec frais spéciaux
    DOUALA: 500,
    YAOUNDE: 300,
    GAROUA: 800,
    MAROUA: 1000,
    // Ajouter d'autres villes selon les besoins
  },
};

/**
 * Interface pour les informations de livraison
 */
export interface DeliveryInfo {
  farmAddress: string;
  deliveryAddress: string;
  deliveryType: 'PICKUP' | 'DELIVERY' | 'MARKET';
  totalWeight: number;
  itemsCount: number;
}

/**
 * Service de calcul des frais de livraison
 */
export class DeliveryFeeService {
  /**
   * Calcule les frais de livraison
   */
  static calculateDeliveryFee(deliveryInfo: DeliveryInfo): number {
    try {
      const { deliveryType, deliveryAddress, farmAddress, totalWeight } = deliveryInfo;

      // Ramassage gratuit
      if (deliveryType === 'PICKUP') {
        return DELIVERY_FEES.DELIVERY_TYPES.PICKUP;
      }

      // Marché - frais fixe réduit
      if (deliveryType === 'MARKET') {
        return DELIVERY_FEES.DELIVERY_TYPES.MARKET;
      }

      // Livraison normale - calcul détaillé
      let totalFee = DELIVERY_FEES.BASE_FEE;

      // Ajouter frais de distance (estimation basée sur les adresses)
      const distanceFee = this.calculateDistanceFee(farmAddress, deliveryAddress);
      totalFee += distanceFee;

      // Ajouter frais de poids
      const weightFee = this.calculateWeightFee(totalWeight);
      totalFee += weightFee;

      // Ajouter frais de zone spéciale
      const zoneFee = this.calculateZoneFee(deliveryAddress);
      totalFee += zoneFee;

      logger.debug('Frais de livraison calculés', {
        deliveryInfo,
        fees: {
          base: DELIVERY_FEES.BASE_FEE,
          distance: distanceFee,
          weight: weightFee,
          zone: zoneFee,
          total: totalFee,
        },
      });

      return totalFee;
    } catch (error) {
      logger.error('Erreur lors du calcul des frais de livraison', { error, deliveryInfo });
      // Retourner frais par défaut en cas d'erreur
      return DELIVERY_FEES.BASE_FEE;
    }
  }

  /**
   * Calcule les frais selon la distance (estimation simplifiée)
   */
  private static calculateDistanceFee(farmAddress: string, deliveryAddress: string): number {
    // Estimation simplifiée basée sur les adresses
    // En production, utiliser une API de calcul de distance (Google Maps, Mapbox, etc.)

    const farmLocation = this.extractLocationInfo(farmAddress);
    const deliveryLocation = this.extractLocationInfo(deliveryAddress);

    // Distance estimée basée sur la similarité des localisations
    const distance = this.estimateDistance(farmLocation, deliveryLocation);

    if (distance <= 5) return DELIVERY_FEES.DISTANCE_FEES['0-5'];
    if (distance <= 10) return DELIVERY_FEES.DISTANCE_FEES['5-10'];
    if (distance <= 20) return DELIVERY_FEES.DISTANCE_FEES['10-20'];
    if (distance <= 50) return DELIVERY_FEES.DISTANCE_FEES['20-50'];
    return DELIVERY_FEES.DISTANCE_FEES['50+'];
  }

  /**
   * Calcule les frais selon le poids
   */
  private static calculateWeightFee(totalWeight: number): number {
    if (totalWeight <= 2) return DELIVERY_FEES.WEIGHT_FEES['0-2'];
    if (totalWeight <= 5) return DELIVERY_FEES.WEIGHT_FEES['2-5'];
    if (totalWeight <= 10) return DELIVERY_FEES.WEIGHT_FEES['5-10'];
    if (totalWeight <= 20) return DELIVERY_FEES.WEIGHT_FEES['10-20'];
    return DELIVERY_FEES.WEIGHT_FEES['20+'];
  }

  /**
   * Calcule les frais de zone spéciale
   */
  private static calculateZoneFee(deliveryAddress: string): number {
    const address = deliveryAddress.toUpperCase();

    // Vérifier les zones spéciales
    if (address.includes('DOUALA')) return DELIVERY_FEES.SPECIAL_ZONES.DOUALA;
    if (address.includes('YAOUNDE')) return DELIVERY_FEES.SPECIAL_ZONES.YAOUNDE;
    if (address.includes('GAROUA')) return DELIVERY_FEES.SPECIAL_ZONES.GAROUA;
    if (address.includes('MAROUA')) return DELIVERY_FEES.SPECIAL_ZONES.MAROUA;

    return 0; // Pas de frais supplémentaire
  }

  /**
   * Extrait les informations de localisation d'une adresse
   */
  private static extractLocationInfo(address: string): { city: string; region: string } {
    // Extraction simplifiée - en production utiliser une API de géocodage
    const upperAddress = address.toUpperCase();

    // Liste des villes camerounaises principales
    const cities = [
      'YAOUNDE',
      'DOUALA',
      'GAROUA',
      'MAROUA',
      'BAFOUSSAM',
      'BAMENDA',
      'BERTOUA',
      'BUEA',
      'EDEA',
      'LIMBE',
    ];

    for (const city of cities) {
      if (upperAddress.includes(city)) {
        return {
          city,
          region: this.getRegionFromCity(city),
        };
      }
    }

    return { city: 'UNKNOWN', region: 'UNKNOWN' };
  }

  /**
   * Obtient la région à partir d'une ville
   */
  private static getRegionFromCity(city: string): string {
    const regions: Record<string, string> = {
      YAOUNDE: 'CENTRE',
      DOUALA: 'LITTORAL',
      GAROUA: 'NORD',
      MAROUA: 'EXTREME-NORD',
      BAFOUSSAM: 'OUEST',
      BAMENDA: 'NORD-OUEST',
      BERTOUA: 'EST',
      BUEA: 'SUD-OUEST',
      EDEA: 'LITTORAL',
      LIMBE: 'SUD-OUEST',
    };

    return regions[city] || 'UNKNOWN';
  }

  /**
   * Estime la distance entre deux localisations
   */
  private static estimateDistance(
    loc1: { city: string; region: string },
    loc2: { city: string; region: string },
  ): number {
    // Même ville
    if (loc1.city === loc2.city) return 0;

    // Même région
    if (loc1.region === loc2.region) return 10;

    // Régions différentes
    return 50;
  }

  /**
   * Calcule le poids total des items
   */
  static calculateTotalWeight(items: Array<{ weight?: number; quantity: number }>): number {
    return items.reduce((total, item) => {
      const weight = item.weight || 0.5; // Poids par défaut de 0.5kg si non spécifié
      return total + weight * item.quantity;
    }, 0);
  }

  /**
   * Valide les informations de livraison
   */
  static validateDeliveryInfo(deliveryInfo: Partial<DeliveryInfo>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!deliveryInfo.deliveryAddress) {
      errors.push('Adresse de livraison requise');
    }

    if (
      !deliveryInfo.deliveryType ||
      !['PICKUP', 'DELIVERY', 'MARKET'].includes(deliveryInfo.deliveryType)
    ) {
      errors.push('Type de livraison invalide');
    }

    if (deliveryInfo.totalWeight !== undefined && deliveryInfo.totalWeight < 0) {
      errors.push('Poids total invalide');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
