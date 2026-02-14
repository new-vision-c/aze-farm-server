#!/usr/bin/env python3

import os
import yaml
import json
from pathlib import Path

def load_yaml_file(file_path):
    """Charge un fichier YAML"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    except Exception as e:
        print(f"Erreur lors du chargement de {file_path}: {e}")
        return None

def load_all_yaml_files(directory):
    """Charge tous les fichiers YAML d'un répertoire"""
    result = {}
    if not os.path.exists(directory):
        print(f"Répertoire {directory} n'existe pas")
        return result
    
    for file_path in Path(directory).glob("*.yaml"):
        content = load_yaml_file(file_path)
        if content:
            result[file_path.stem] = content
            print(f"Chargé: {file_path.name}")
    
    return result

def resolve_references(obj, base_path=""):
    """Résout les références $ref dans un objet"""
    if isinstance(obj, dict):
        for key, value in obj.items():
            if key == '$ref' and isinstance(value, str):
                if value.startswith('../'):
                    # Remplacer les références relatives par des références absolues
                    ref = value.replace('../components/', '#/components/')
                    # Enlever l'extension .yaml et les chemins supplémentaires
                    ref = ref.replace('.yaml', '')
                    if '#/components/responses/' in ref:
                        ref = ref.split('#/components/responses/')[1]
                        ref = f'#/components/responses/{ref}'
                    elif '#/components/parameters/' in ref:
                        ref = ref.split('#/components/parameters/')[1]
                        ref = f'#/components/parameters/{ref}'
                    elif '#/components/schemas/' in ref:
                        ref = ref.split('#/components/schemas/')[1]
                        ref = f'#/components/schemas/{ref}'
                    obj[key] = ref
                elif value.startswith('./'):
                    obj[key] = value.replace('./', '#/paths/')
            else:
                resolve_references(value, base_path)
    elif isinstance(obj, list):
        for item in obj:
            resolve_references(item, base_path)

def merge_openapi_spec():
    """Fusionne tous les fichiers pour créer la spécification OpenAPI complète"""
    
    # Charger le fichier openapi.yaml existant comme base
    base_spec = load_yaml_file('docs/openapi.yaml')
    if not base_spec:
        print("Erreur: Impossible de charger docs/openapi.yaml")
        return
    
    # Créer la structure de base
    openapi_spec = {
        'openapi': base_spec.get('openapi', '3.0.3'),
        'info': base_spec.get('info', {}),
        'servers': base_spec.get('servers', []),
        'tags': base_spec.get('tags', []),
        'paths': {},
        'components': {
            'securitySchemes': base_spec.get('components', {}).get('securitySchemes', {}),
            'schemas': {},
            'parameters': {},
            'responses': {}
        }
    }
    
    # Charger et fusionner les paths
    print("Chargement des paths...")
    path_files = load_all_yaml_files('docs/paths')
    
    for filename, content in path_files.items():
        if isinstance(content, dict):
            # Fusionner les chemins
            for path, path_data in content.items():
                if path.startswith('/'):  # C'est un chemin d'API
                    openapi_spec['paths'][path] = path_data
    
    # Charger et fusionner les composants
    print("Chargement des composants...")
    
    # Schémas
    schema_files = load_all_yaml_files('docs/components/schemas')
    for filename, content in schema_files.items():
        if isinstance(content, dict):
            openapi_spec['components']['schemas'].update(content)
    
    # Paramètres
    param_files = load_all_yaml_files('docs/components/parameters')
    for filename, content in param_files.items():
        if isinstance(content, dict):
            openapi_spec['components']['parameters'].update(content)
    
    # Réponses
    response_files = load_all_yaml_files('docs/components/responses')
    for filename, content in response_files.items():
        if isinstance(content, dict):
            openapi_spec['components']['responses'].update(content)
    
    # Résoudre les références $ref
    print("Résolution des références...")
    resolve_references(openapi_spec)
    
    # Écrire le fichier final
    output_path = 'docs/openapi.yaml'
    try:
        with open(output_path, 'w', encoding='utf-8') as f:
            yaml.dump(openapi_spec, f, default_flow_style=False, allow_unicode=True, indent=2)
        
        print(f"\n✅ Fichier OpenAPI généré: {output_path}")
        print(f"📊 Stats:")
        print(f"   - Paths: {len(openapi_spec['paths'])}")
        print(f"   - Schemas: {len(openapi_spec['components']['schemas'])}")
        print(f"   - Parameters: {len(openapi_spec['components']['parameters'])}")
        print(f"   - Responses: {len(openapi_spec['components']['responses'])}")
        
    except Exception as e:
        print(f"Erreur lors de l'écriture du fichier: {e}")

if __name__ == "__main__":
    merge_openapi_spec()
