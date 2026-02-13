import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Données des fermes
const farmsData = [
  {
    name: 'Ferme du Soleil Levant',
    description:
      'Ferme biologique spécialisée dans les légumes frais et les fruits de saison. Située dans la vallée de la Loire, nous cultivons avec passion depuis 3 générations.',
    address: '15 Route de Sologne, 41240 Saint-Laurent-des-Arbres',
    geoLocation: { latitude: 47.5836, longitude: 1.3367 },
    siret: '12345678901234',
    images: [
      'https://images.unsplash.com/photo-1592982506659-fd3d5c876018?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1605000797499-95a51c5269ad?w=800&h=600&fit=crop',
    ],
  },
  {
    name: 'Domaine des Collines Vertes',
    description:
      "Élevage de vaches laitières et production de fromages artisanaux. Nos vaches paissent dans des prairies naturelles toute l'année.",
    address: '8 Chemin des Pâturages, 63120 Saint-Genès-Champanelle',
    geoLocation: { latitude: 45.7772, longitude: 3.087 },
    siret: '23456789012345',
    images: [
      'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1585060778017-05a5db9dc4c2?w=800&h=600&fit=crop',
    ],
  },
  {
    name: 'La Ferme Traditionnelle',
    description:
      'Spécialisée dans les produits du terroir et les conserves maison. Recettes transmises de mère en fille depuis 1920.',
    address: "23 Grand'Rue, 07200 Saint-Maurice-d'Ardèche",
    geoLocation: { latitude: 44.5167, longitude: 4.2833 },
    siret: '34567890123456',
    images: [
      'https://images.unsplash.com/photo-1445205170230-053b83016050?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1506617420156-8e4536971650?w=800&h=600&fit=crop',
    ],
  },
  {
    name: 'Vergers de Provence',
    description:
      'Producteurs de fruits et légumes méditerranéens. Cultivons le soleil et les saveurs du sud depuis 25 ans.',
    address: '156 Avenue des Oliviers, 84230 Le Thor',
    geoLocation: { latitude: 43.9235, longitude: 5.0063 },
    siret: '45678901234567',
    images: [
      'https://images.unsplash.com/photo-1519996529931-28324d5a630e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1543076499-a6133cb561c0?w=800&h=600&fit=crop',
    ],
  },
  {
    name: 'Ferme Montagnarde',
    description:
      "Élevage en altitude et production de spécialités montagnardes. Nos animaux grandissent en plein air à 1500m d'altitude.",
    address: '5 Route du Col, 73570 Saint-Jean-de-Maurienne',
    geoLocation: { latitude: 45.5667, longitude: 6.0167 },
    siret: '56789012345678',
    images: [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop',
    ],
  },
];

// Catégories de produits
const categories = [
  'Légumes',
  'Fruits',
  'Produits laitiers',
  'Viandes',
  'Pains et Pâtisseries',
  'Miel et Confitures',
  'Herbes Aromatiques',
  'Céréales et Farines',
  'Boissons',
  'Produits Transformés',
];

// Templates de produits par catégorie
const productTemplates = {
  Légumes: [
    { name: 'Carottes', unit: 'kg', basePrice: 2.5, stockRange: [50, 200] },
    { name: 'Tomates', unit: 'kg', basePrice: 4.2, stockRange: [30, 150] },
    { name: 'Patates douces', unit: 'kg', basePrice: 3.8, stockRange: [40, 180] },
    { name: 'Courgettes', unit: 'kg', basePrice: 2.8, stockRange: [60, 220] },
    { name: 'Poivrons', unit: 'kg', basePrice: 5.5, stockRange: [35, 160] },
    { name: 'Aubergines', unit: 'kg', basePrice: 3.2, stockRange: [25, 120] },
    { name: 'Salades', unit: 'pièce', basePrice: 1.8, stockRange: [40, 100] },
    { name: 'Oignons', unit: 'kg', basePrice: 2.2, stockRange: [80, 250] },
    { name: 'Ail', unit: 'pièce', basePrice: 0.5, stockRange: [100, 300] },
    { name: 'Choux-fleurs', unit: 'pièce', basePrice: 2.8, stockRange: [30, 80] },
  ],
  Fruits: [
    { name: 'Pommes', unit: 'kg', basePrice: 3.5, stockRange: [100, 300] },
    { name: 'Poires', unit: 'kg', basePrice: 4.2, stockRange: [60, 200] },
    { name: 'Pêches', unit: 'kg', basePrice: 6.8, stockRange: [40, 150] },
    { name: 'Cerises', unit: 'kg', basePrice: 8.5, stockRange: [20, 80] },
    { name: 'Fraises', unit: 'barquette', basePrice: 4.5, stockRange: [30, 120] },
    { name: 'Framboises', unit: 'barquette', basePrice: 5.8, stockRange: [25, 100] },
    { name: 'Myrtilles', unit: 'barquette', basePrice: 6.2, stockRange: [20, 90] },
    { name: 'Agrumes', unit: 'kg', basePrice: 3.8, stockRange: [80, 200] },
    { name: 'Raisins', unit: 'kg', basePrice: 5.5, stockRange: [50, 180] },
    { name: 'Kiwis', unit: 'kg', basePrice: 4.8, stockRange: [40, 140] },
  ],
  'Produits laitiers': [
    { name: 'Fromage de chèvre', unit: 'pièce', basePrice: 8.5, stockRange: [20, 60] },
    { name: 'Yaourts nature', unit: 'pot', basePrice: 1.2, stockRange: [50, 150] },
    { name: 'Beurre fermier', unit: '250g', basePrice: 4.5, stockRange: [30, 80] },
    { name: 'Crème fraîche', unit: '500ml', basePrice: 3.2, stockRange: [25, 70] },
    { name: 'Fromage à pâte molle', unit: 'pièce', basePrice: 6.8, stockRange: [15, 40] },
    { name: 'Fromage à pâte pressée', unit: 'pièce', basePrice: 12.5, stockRange: [10, 30] },
    { name: 'Lait frais', unit: 'litre', basePrice: 1.8, stockRange: [40, 100] },
    { name: 'Fromage blanc', unit: 'pot', basePrice: 2.8, stockRange: [35, 90] },
    { name: 'Mozzarella', unit: 'pièce', basePrice: 3.5, stockRange: [25, 70] },
    { name: 'Raclette', unit: 'pièce', basePrice: 15.8, stockRange: [8, 25] },
  ],
  Viandes: [
    { name: 'Bœuf bio', unit: 'kg', basePrice: 25.5, stockRange: [15, 40] },
    { name: 'Poulet fermier', unit: 'pièce', basePrice: 18.8, stockRange: [20, 50] },
    { name: 'Agneau', unit: 'kg', basePrice: 28.5, stockRange: [10, 30] },
    { name: 'Porc', unit: 'kg', basePrice: 15.8, stockRange: [25, 60] },
    { name: 'Veau', unit: 'kg', basePrice: 32.5, stockRange: [8, 25] },
    { name: 'Saucisses artisanales', unit: 'kg', basePrice: 18.5, stockRange: [30, 80] },
    { name: 'Jambon cru', unit: 'kg', basePrice: 35.8, stockRange: [5, 20] },
    { name: 'Merguez', unit: 'kg', basePrice: 12.5, stockRange: [40, 100] },
    { name: 'Côtelettes', unit: 'kg', basePrice: 22.5, stockRange: [20, 50] },
    { name: 'Rôti', unit: 'pièce', basePrice: 45.8, stockRange: [3, 15] },
  ],
  'Pains et Pâtisseries': [
    { name: 'Pain de campagne', unit: 'pièce', basePrice: 4.5, stockRange: [30, 80] },
    { name: 'Baguette tradition', unit: 'pièce', basePrice: 1.2, stockRange: [50, 150] },
    { name: 'Pain complet', unit: 'pièce', basePrice: 5.2, stockRange: [25, 70] },
    { name: 'Croissants', unit: 'pièce', basePrice: 1.5, stockRange: [40, 120] },
    { name: 'Tarte aux pommes', unit: 'pièce', basePrice: 12.5, stockRange: [8, 25] },
    { name: 'Pain au levain', unit: 'pièce', basePrice: 6.8, stockRange: [20, 60] },
    { name: 'Brioche', unit: 'pièce', basePrice: 8.5, stockRange: [15, 40] },
    { name: 'Gâteau chocolat', unit: 'pièce', basePrice: 15.8, stockRange: [5, 20] },
    { name: 'Pain aux noix', unit: 'pièce', basePrice: 7.2, stockRange: [18, 50] },
    { name: 'Madeleines', unit: 'sachet', basePrice: 5.5, stockRange: [25, 70] },
  ],
  'Miel et Confitures': [
    { name: 'Miel de fleurs', unit: 'pot', basePrice: 8.5, stockRange: [20, 60] },
    { name: "Miel d'acacia", unit: 'pot', basePrice: 9.8, stockRange: [15, 50] },
    { name: 'Confiture de fraises', unit: 'pot', basePrice: 6.5, stockRange: [25, 70] },
    { name: "Confiture d'abricots", unit: 'pot', basePrice: 6.2, stockRange: [30, 80] },
    { name: 'Miel de châtaignier', unit: 'pot', basePrice: 10.5, stockRange: [12, 40] },
    { name: 'Confiture de figues', unit: 'pot', basePrice: 7.8, stockRange: [20, 60] },
    { name: 'Miel de lavande', unit: 'pot', basePrice: 11.2, stockRange: [10, 35] },
    { name: 'Confiture de cerises', unit: 'pot', basePrice: 6.8, stockRange: [22, 65] },
    { name: 'Miel de forêt', unit: 'pot', basePrice: 12.5, stockRange: [8, 30] },
    { name: 'Gelée de coings', unit: 'pot', basePrice: 5.8, stockRange: [18, 55] },
  ],
  'Herbes Aromatiques': [
    { name: 'Basilic', unit: 'botte', basePrice: 2.5, stockRange: [40, 120] },
    { name: 'Persil', unit: 'botte', basePrice: 1.8, stockRange: [50, 150] },
    { name: 'Ciboulette', unit: 'botte', basePrice: 2.2, stockRange: [45, 130] },
    { name: 'Menthe', unit: 'botte', basePrice: 2.8, stockRange: [35, 100] },
    { name: 'Romarin', unit: 'botte', basePrice: 3.2, stockRange: [30, 90] },
    { name: 'Thym', unit: 'botte', basePrice: 2.9, stockRange: [40, 110] },
    { name: 'Sauge', unit: 'botte', basePrice: 3.5, stockRange: [25, 80] },
    { name: 'Laurier', unit: 'branche', basePrice: 1.5, stockRange: [60, 180] },
    { name: 'Aneth', unit: 'botte', basePrice: 3.8, stockRange: [20, 70] },
    { name: 'Coriandre', unit: 'botte', basePrice: 3.2, stockRange: [30, 85] },
  ],
  'Céréales et Farines': [
    { name: 'Farine de blé', unit: 'kg', basePrice: 2.8, stockRange: [50, 150] },
    { name: 'Farine complète', unit: 'kg', basePrice: 3.5, stockRange: [40, 120] },
    { name: "Flocons d'avoine", unit: 'kg', basePrice: 4.2, stockRange: [35, 100] },
    { name: 'Riz complet', unit: 'kg', basePrice: 5.8, stockRange: [30, 90] },
    { name: 'Quinoa', unit: 'kg', basePrice: 8.5, stockRange: [20, 60] },
    { name: 'Seigle', unit: 'kg', basePrice: 3.2, stockRange: [25, 75] },
    { name: 'Épeautre', unit: 'kg', basePrice: 6.8, stockRange: [15, 50] },
    { name: 'Sarrasin', unit: 'kg', basePrice: 4.5, stockRange: [30, 85] },
    { name: 'Orge', unit: 'kg', basePrice: 2.5, stockRange: [40, 110] },
    { name: 'Millet', unit: 'kg', basePrice: 5.2, stockRange: [18, 55] },
  ],
  Boissons: [
    { name: 'Jus de pommes', unit: 'litre', basePrice: 4.5, stockRange: [30, 80] },
    { name: "Jus d'oranges", unit: 'litre', basePrice: 5.2, stockRange: [25, 70] },
    { name: 'Cidre artisanal', unit: 'bouteille', basePrice: 6.8, stockRange: [20, 60] },
    { name: 'Vin rouge bio', unit: 'bouteille', basePrice: 12.5, stockRange: [15, 45] },
    { name: 'Vin blanc', unit: 'bouteille', basePrice: 10.8, stockRange: [18, 50] },
    { name: 'Sirop de fraises', unit: 'bouteille', basePrice: 7.5, stockRange: [25, 75] },
    { name: 'Thé vert', unit: 'sachet', basePrice: 8.2, stockRange: [30, 90] },
    { name: 'Tisane camomille', unit: 'sachet', basePrice: 6.5, stockRange: [35, 100] },
    { name: 'Limonade artisanale', unit: 'bouteille', basePrice: 4.8, stockRange: [40, 120] },
    { name: "Eau de fleur d'oranger", unit: 'flacon', basePrice: 5.5, stockRange: [20, 65] },
  ],
  'Produits Transformés': [
    { name: 'Soupes maison', unit: 'pot', basePrice: 4.5, stockRange: [25, 70] },
    { name: 'Ratatouille', unit: 'pot', basePrice: 6.8, stockRange: [20, 60] },
    { name: 'Choucroute', unit: 'kg', basePrice: 8.5, stockRange: [15, 45] },
    { name: 'Tapenade', unit: 'pot', basePrice: 7.2, stockRange: [30, 85] },
    { name: 'Pesto maison', unit: 'pot', basePrice: 8.8, stockRange: [18, 55] },
    { name: 'Terrine de campagne', unit: 'pot', basePrice: 12.5, stockRange: [12, 35] },
    { name: 'Rillettes de saumon', unit: 'pot', basePrice: 15.8, stockRange: [8, 25] },
    { name: 'Conserves de légumes', unit: 'pot', basePrice: 5.5, stockRange: [35, 100] },
    { name: 'Sauces tomates', unit: 'pot', basePrice: 4.2, stockRange: [40, 110] },
    { name: 'Plats cuisinés', unit: 'portion', basePrice: 8.5, stockRange: [20, 65] },
  ],
};

function getRandomPrice(basePrice: number): number {
  return Number((basePrice * (0.8 + Math.random() * 0.4)).toFixed(2));
}

function getRandomStock(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getSeasonality(category: string): number[] {
  const seasonMap: { [key: string]: number[] } = {
    Légumes: [5, 6, 7, 8, 9], // Été
    Fruits: [6, 7, 8, 9], // Été-Automne
    'Produits laitiers': [], // Toute l'année
    Viandes: [], // Toute l'année
    'Pains et Pâtisseries': [], // Toute l'année
    'Miel et Confitures': [5, 6, 7, 8], // Été
    'Herbes Aromatiques': [4, 5, 6, 7, 8, 9], // Printemps-Été
    'Céréales et Farines': [7, 8, 9], // Été-Automne
    Boissons: [6, 7, 8, 9, 10], // Été-Automne
    'Produits Transformés': [], // Toute l'année
  };

  return seasonMap[category] || [];
}

async function main() {
  console.log('🌱 Début du seeding de la base de données...');

  try {
    // Nettoyage des données existantes
    console.log('🧹 Nettoyage des données existantes...');
    await prisma.product.deleteMany();
    await prisma.farm.deleteMany();
    await prisma.users.deleteMany({
      where: { role: 'FARMER' },
    });

    // Création des utilisateurs fermiers
    console.log('👨‍🌾 Création des utilisateurs fermiers...');
    const farmers = [];

    for (let i = 0; i < farmsData.length; i++) {
      const hashedPassword = await bcrypt.hash('password123', 10);

      const farmer = await prisma.users.create({
        data: {
          email: `fermer${i + 1}@ferme.com`,
          password: hashedPassword,
          fullname:
            farmsData[i].name.split(' ')[0] +
            ' ' +
            ['Martin', 'Durand', 'Bernard', 'Dubois', 'Petit'][i],
          role: 'FARMER',
          is_active: true,
          is_verified: true,
        },
      });

      farmers.push(farmer);
      console.log(`✅ Fermier ${farmer.fullname} créé`);
    }

    // Création des fermes
    console.log('🏡 Création des fermes...');
    const farms = [];

    for (let i = 0; i < farmsData.length; i++) {
      const farm = await prisma.farm.create({
        data: {
          ...farmsData[i],
          farmerId: farmers[i].user_id,
        },
      });

      farms.push(farm);
      console.log(`✅ Ferme ${farm.name} créée`);
    }

    // Création des produits
    console.log('🥬 Création des produits...');
    let totalProducts = 0;

    for (const farm of farms) {
      for (const category of categories) {
        const templates = productTemplates[category as keyof typeof productTemplates];

        for (const template of templates) {
          const product = await prisma.product.create({
            data: {
              name: template.name,
              description: `${template.name} de qualité supérieure, produit avec passion par ${farm.name}. Parfait pour une cuisine saine et savoureuse.`,
              price: getRandomPrice(template.basePrice),
              unit: template.unit,
              stock: getRandomStock(template.stockRange[0], template.stockRange[1]),
              category: category,
              isAvailable: Math.random() > 0.1, // 90% des produits disponibles
              seasonality: getSeasonality(category),
              images: [
                `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000000)}?w=400&h=300&fit=crop`,
                `https://images.unsplash.com/photo-${1500000000000 + Math.floor(Math.random() * 1000000000)}?w=400&h=300&fit=crop`,
              ],
              farmId: farm.id,
            },
          });

          totalProducts++;
        }
      }
    }

    console.log(`✅ ${totalProducts} produits créés au total`);
    console.log(
      `📊 Répartition: ${farms.length} fermes, ${categories.length} catégories, ${totalProducts / farms.length} produits par ferme en moyenne`,
    );

    console.log('🎉 Seeding terminé avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors du seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
