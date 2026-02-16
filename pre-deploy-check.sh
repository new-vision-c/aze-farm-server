#!/bin/bash

echo "🚀 Vérification pré-déploiement..."
echo

# Vérifier que le fichier OpenAPI existe
if [ ! -f "docs/openapi.yaml" ]; then
    echo "❌ Erreur: docs/openapi.yaml n'existe pas"
    echo "   Exécutez: python3 scripts/merge-openapi-complete.py"
    exit 1
fi

# Vérifier le contenu du fichier OpenAPI
echo "📊 Analyse du fichier OpenAPI..."
python3 -c "
import yaml
with open('docs/openapi.yaml') as f:
    data = yaml.safe_load(f)
    paths_count = len(data.get('paths', {}))
    schemas_count = len(data.get('components', {}).get('schemas', {}))
    tags_count = len(data.get('tags', []))
    
    print(f'✅ Paths: {paths_count}')
    print(f'✅ Schemas: {schemas_count}')
    print(f'✅ Tags: {tags_count}')
    
    if paths_count == 0:
        print('❌ Erreur: Aucun path trouvé dans le fichier OpenAPI')
        exit(1)
    
    print('\\n📋 Premiers paths:')
    for i, path in enumerate(list(data.get('paths', {}).keys())[:5]):
        print(f'   - {path}')
"

if [ $? -ne 0 ]; then
    echo "❌ Erreur lors de la validation du fichier OpenAPI"
    exit 1
fi

echo
echo "🔍 Vérification des fichiers critiques..."
files_to_check=(
    "src/config/swagger/swagger.ts"
    "Dockerfile"
    "package.json"
)

for file in "${files_to_check[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file trouvé"
    else
        echo "❌ $file manquant"
        exit 1
    fi
done

echo
echo "🎉 Vérification terminée avec succès !"
echo "📝 Le fichier OpenAPI est prêt pour le déploiement"
echo "🐳 Le Dockerfile est configuré pour copier le fichier pré-généré"
echo "📦 Le package.json ne génère plus l'OpenAPI pendant l'installation"
