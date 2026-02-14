#!/usr/bin/env python3

import os
import json
from pathlib import Path

def load_yaml_file(file_path):
    """Charge un fichier YAML en utilisant une méthode robuste"""
    try:
        import yaml
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            # Remplacer les caractères problématiques avant parsing
            content = content.replace("'", "'").replace("'", "'")
            return yaml.safe_load(content)
    except Exception as e:
        print(f"Erreur lors du chargement de {file_path}: {e}")
        return None

def create_minimal_openapi():
    """Crée une spécification OpenAPI minimale mais fonctionnelle"""
    
    # Définir les tags de base
    tags = [
        {"name": "Products", "description": "Product search and management with geolocation"},
        {"name": "Authentication", "description": "User authentication and account management"},
        {"name": "Users", "description": "User profile management"},
        {"name": "OAuth", "description": "Third-party authentication (Google, Apple, etc.)"}
    ]
    
    # Définir quelques paths essentiels
    paths = {
        "/auth/register": {
            "post": {
                "tags": ["Authentication"],
                "summary": "Créer un nouveau compte utilisateur",
                "description": "Crée un nouveau compte utilisateur avec email et mot de passe",
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "required": ["email", "password", "fullname"],
                                "properties": {
                                    "email": {"type": "string", "format": "email"},
                                    "password": {"type": "string", "minLength": 6},
                                    "fullname": {"type": "string", "minLength": 2}
                                }
                            }
                        }
                    }
                },
                "responses": {
                    "200": {
                        "description": "Compte créé avec succès",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {"type": "boolean"},
                                        "message": {"type": "string"}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/products/search": {
            "get": {
                "tags": ["Products"],
                "summary": "Rechercher des produits",
                "description": "Recherche des produits avec filtres et localisation",
                "parameters": [
                    {"name": "limit", "in": "query", "schema": {"type": "integer", "default": 10}},
                    {"name": "page", "in": "query", "schema": {"type": "integer", "default": 1}},
                    {"name": "category", "in": "query", "schema": {"type": "string"}},
                    {"name": "lat", "in": "query", "schema": {"type": "number"}},
                    {"name": "lng", "in": "query", "schema": {"type": "number"}}
                ],
                "responses": {
                    "200": {
                        "description": "Produits trouvés",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {"type": "boolean"},
                                        "data": {"type": "array", "items": {"type": "object"}}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        },
        "/users/profile": {
            "get": {
                "tags": ["Users"],
                "summary": "Obtenir le profil utilisateur",
                "description": "Récupère les informations du profil utilisateur",
                "security": [{"bearerAuth": []}],
                "responses": {
                    "200": {
                        "description": "Profil récupéré avec succès",
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "success": {"type": "boolean"},
                                        "data": {"type": "object"}
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    
    # Schémas de base
    schemas = {
        "User": {
            "type": "object",
            "properties": {
                "id": {"type": "string"},
                "email": {"type": "string", "format": "email"},
                "fullname": {"type": "string"},
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
                "category": {"type": "string"}
            }
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
            "schemas": schemas
        }
    }
    
    return openapi_spec

def main():
    """Fonction principale"""
    print("Génération de la spécification OpenAPI...")
    
    # Créer la spécification
    openapi_spec = create_minimal_openapi()
    
    # Écrire le fichier YAML
    output_path = 'docs/openapi.yaml'
    try:
        import yaml
        with open(output_path, 'w', encoding='utf-8') as f:
            yaml.dump(openapi_spec, f, default_flow_style=False, allow_unicode=True, indent=2)
        
        print(f"\n✅ Fichier OpenAPI généré: {output_path}")
        print(f"📊 Stats:")
        print(f"   - Paths: {len(openapi_spec['paths'])}")
        print(f"   - Schemas: {len(openapi_spec['components']['schemas'])}")
        print(f"   - Tags: {len(openapi_spec['tags'])}")
        
    except Exception as e:
        print(f"Erreur lors de l'écriture du fichier: {e}")

if __name__ == "__main__":
    main()
