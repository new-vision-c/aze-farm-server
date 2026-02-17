#!/usr/bin/env python3

import os
import json
import re
from pathlib import Path

def clean_text(text):
    """Nettoie le texte pour éviter les erreurs YAML"""
    if not isinstance(text, str):
        return text
    # Remplacer les caractères problématiques
    text = text.replace("'", "'").replace("'", "'")
    text = text.replace('"', "'")
    text = re.sub(r'[^\x00-\x7F]+', '', text)  # Supprimer les caractères non-ASCII
    return text.strip()

def extract_paths_from_yaml():
    """Extrait tous les paths des fichiers YAML sources"""
    paths = {}
    
    # Fichiers à traiter
    yaml_files = [
        'docs/paths/auth.yaml',
        'docs/paths/products.yaml', 
        'docs/paths/users.yaml',
        'docs/paths/oauth.yaml',
        'docs/paths/farms.yaml',
        'docs/paths/system.yaml'
    ]
    
    for yaml_file in yaml_files:
        if not os.path.exists(yaml_file):
            continue
            
        print(f"Traitement de {yaml_file}...")
        
        try:
            with open(yaml_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Nettoyer le contenu
            content = clean_text(content)
            
            # Extraire les paths avec une regex
            path_pattern = r'^(/\S+):\s*\n\s+(get|post|put|delete|patch):'
            matches = re.findall(path_pattern, content, re.MULTILINE)
            
            for path, method in matches:
                if path not in paths:
                    paths[path] = {}
                
                # Déterminer le tag basé sur le path
                if path.startswith('/auth'):
                    tag = 'Authentication'
                elif path.startswith('/products'):
                    tag = 'Products'
                elif path.startswith('/users'):
                    tag = 'Users'
                elif path.startswith('/farms'):
                    tag = 'Farms'
                elif path.startswith('/oauth'):
                    tag = 'OAuth'
                elif path in ['/_csp-reports', '/csrf-token', '/health']:
                    tag = 'System'
                else:
                    tag = 'Default'
                
                # Créer une définition de base pour le path
                paths[path][method] = {
                    'tags': [tag],
                    'summary': clean_text(f"{method.title()} {path}"),
                    'description': clean_text(f"Endpoint {method} pour {path}"),
                    'responses': {
                        '200': {
                            'description': 'Succès',
                            'content': {
                                'application/json': {
                                    'schema': {
                                        'type': 'object',
                                        'properties': {
                                            'success': {'type': 'boolean'},
                                            'message': {'type': 'string'}
                                        }
                                    }
                                }
                            }
                        },
                        '400': {
                            'description': 'Requête invalide'
                        },
                        '500': {
                            'description': 'Erreur serveur'
                        }
                    }
                }
                
                # Ajouter la sécurité pour les routes protégées
                if path.startswith('/auth/') and path not in ['/auth/register', '/auth/login', '/auth/forgot-password', '/auth/verify-otp', '/auth/reset-password/{resetToken}']:
                    paths[path][method]['security'] = [{'bearerAuth': []}]
                elif path.startswith('/users') or path.startswith('/oauth'):
                    paths[path][method]['security'] = [{'bearerAuth': []}]
                
                # Ajouter des requestBody pour POST/PUT
                if method in ['post', 'put']:
                    paths[path][method]['requestBody'] = {
                        'required': True,
                        'content': {
                            'application/json': {
                                'schema': {
                                    'type': 'object',
                                    'properties': {
                                        'data': {'type': 'object'}
                                    }
                                }
                            }
                        }
                    }
                
        except Exception as e:
            print(f"Erreur lors du traitement de {yaml_file}: {e}")
    
    return paths

def create_complete_openapi():
    """Crée une spécification OpenAPI complète avec toutes les routes"""
    
    # Tags
    tags = [
        {"name": "Products", "description": "Product search and management with geolocation"},
        {"name": "Farms", "description": "Farm management and product listings"},
        {"name": "Authentication", "description": "User authentication and account management"},
        {"name": "Users", "description": "User profile management"},
        {"name": "OAuth", "description": "Third-party authentication (Google, Apple, etc.)"},
        {"name": "System", "description": "System endpoints"}
    ]
    
    # Extraire tous les paths
    paths = extract_paths_from_yaml()
    
    # Schémas de base
    schemas = {
        "User": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "email": {"type": "string", "format": "email"},
                "fullname": {"type": "string"},
                "role": {"type": "string", "enum": ["user", "admin", "moderator"]},
                "createdAt": {"type": "string", "format": "date-time"},
                "updatedAt": {"type": "string", "format": "date-time"}
            }
        },
        "Farm": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"},
                "description": {"type": "string"},
                "address": {"type": "string"},
                "geoLocation": {
                    "type": "object",
                    "properties": {
                        "latitude": {"type": "number"},
                        "longitude": {"type": "number"}
                    }
                },
                "images": {"type": "array", "items": {"type": "string"}},
                "rating": {
                    "type": "object",
                    "properties": {
                        "average": {"type": "number"},
                        "count": {"type": "integer"}
                    }
                },
                "categories": {"type": "array", "items": {"type": "string"}},
                "products": {
                    "type": "array",
                    "items": {"$ref": "#/components/schemas/FarmProduct"}
                }
            }
        },
        "FarmProduct": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"},
                "price": {"type": "number"},
                "unit": {"type": "string"},
                "stock": {"type": "integer"},
                "image": {"type": "string"},
                "category": {"type": "string"},
                "createdAt": {"type": "string", "format": "date-time"}
            }
        },
        "Product": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "name": {"type": "string"},
                "description": {"type": "string"},
                "price": {"type": "number"},
                "category": {"type": "string"},
                "images": {"type": "array", "items": {"type": "string"}},
                "location": {
                    "type": "object",
                    "properties": {
                        "lat": {"type": "number"},
                        "lng": {"type": "number"},
                        "address": {"type": "string"}
                    }
                }
            }
        },
        "AuthResponse": {
            "type": "object",
            "properties": {
                "success": {"type": "boolean"},
                "message": {"type": "string"},
                "data": {
                    "type": "object",
                    "properties": {
                        "token": {"type": "string"},
                        "user": {"$ref": "#/components/schemas/User"}
                    }
                }
            }
        },
        "ErrorResponse": {
            "type": "object",
            "properties": {
                "success": {"type": "boolean", "example": False},
                "message": {"type": "string"},
                "error": {"type": "string"}
            }
        }
    }
    
    # Paramètres communs
    parameters = {
        "limit": {
            "name": "limit",
            "in": "query",
            "schema": {"type": "integer", "default": 10, "minimum": 1, "maximum": 100},
            "description": "Nombre maximum de résultats"
        },
        "page": {
            "name": "page",
            "in": "query",
            "schema": {"type": "integer", "default": 1, "minimum": 1},
            "description": "Numéro de page"
        },
        "userId": {
            "name": "userId",
            "in": "path",
            "required": True,
            "schema": {"type": "string"},
            "description": "ID de l'utilisateur"
        },
        "productId": {
            "name": "id",
            "in": "path",
            "required": True,
            "schema": {"type": "string"},
            "description": "ID du produit"
        },
        "farmId": {
            "name": "id",
            "in": "path",
            "required": True,
            "schema": {"type": "string"},
            "description": "ID de la ferme"
        }
    }
    
    # Créer la spécification OpenAPI
    openapi_spec = {
        "openapi": "3.0.3",
        "info": {
            "title": "AZE FARM API Documentation",
            "description": "API complète pour la gestion des produits agricoles, fermes et commandes avec recherche géolocalisée",
            "version": "1.0.0",
            "contact": {
                "name": "Équipe Support AZE FARM",
                "email": "support@azefarm.com",
                "url": "https://azefarm.com/support"
            }
        },
        "servers": [
            {"url": "http://localhost:3000", "description": "Environnement de développement local"},
            {"url": "https://api.staging.azefarm.com", "description": "Environnement de staging"},
            {"url": "https://api.azefarm.com", "description": "Production"}
        ],
        "tags": tags,
        "paths": paths,
        "components": {
            "securitySchemes": {
                "bearerAuth": {
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "JWT",
                    "description": "JWT obtained after authentication"
                }
            },
            "schemas": schemas,
            "parameters": parameters
        }
    }
    
    return openapi_spec

def main():
    """Fonction principale"""
    print("Génération de la spécification OpenAPI complète...")
    
    # Créer la spécification
    openapi_spec = create_complete_openapi()
    
    # Écrire le fichier YAML
    output_path = 'docs/openapi.yaml'
    try:
        import yaml
        with open(output_path, 'w', encoding='utf-8') as f:
            yaml.dump(openapi_spec, f, default_flow_style=False, allow_unicode=True, indent=2, width=1000)
        
        print(f"\n✅ Fichier OpenAPI généré: {output_path}")
        print(f"📊 Stats:")
        print(f"   - Paths: {len(openapi_spec['paths'])}")
        print(f"   - Schemas: {len(openapi_spec['components']['schemas'])}")
        print(f"   - Parameters: {len(openapi_spec['components']['parameters'])}")
        print(f"   - Tags: {len(openapi_spec['tags'])}")
        
        # Afficher les paths par catégorie
        paths_by_tag = {}
        for path, methods in openapi_spec['paths'].items():
            for method, details in methods.items():
                tags = details.get('tags', ['Default'])
                for tag in tags:
                    if tag not in paths_by_tag:
                        paths_by_tag[tag] = []
                    paths_by_tag[tag].append(f"{method.upper()} {path}")
        
        print(f"\n📋 Routes par tag:")
        for tag, route_list in paths_by_tag.items():
            print(f"   {tag}: {len(route_list)} routes")
            for route in route_list[:3]:  # Afficher les 3 premières
                print(f"     - {route}")
            if len(route_list) > 3:
                print(f"     ... et {len(route_list) - 3} autres")
        
    except Exception as e:
        print(f"Erreur lors de l'écriture du fichier: {e}")

if __name__ == "__main__":
    main()
