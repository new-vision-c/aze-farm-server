#!/bin/bash

# Script de test pour l'internationalisation
echo "🌐 Test de l'internationalisation du serveur..."

BASE_URL="http://localhost:3000/api/v1/example"

# Test en français
echo -e "\n🇫🇷 Test en français (Accept-Language: fr-FR)"
curl -X GET "$BASE_URL/test" \
  -H "Accept-Language: fr-FR" \
  -H "Content-Type: application/json" \
  | jq '.'

# Test en anglais
echo -e "\n🇬🇧 Test en anglais (Accept-Language: en-US)"
curl -X GET "$BASE_URL/test" \
  -H "Accept-Language: en-US" \
  -H "Content-Type: application/json" \
  | jq '.'

# Test avec paramètres
echo -e "\n🔧 Test avec paramètres"
curl -X GET "$BASE_URL/params" \
  -H "Accept-Language: fr-FR" \
  -H "Content-Type: application/json" \
  | jq '.'

# Test d'erreur
echo -e "\n❌ Test d'erreur 404"
curl -X GET "$BASE_URL/error" \
  -H "Accept-Language: fr-FR" \
  -H "Content-Type: application/json" \
  | jq '.'

# Test de validation
echo -e "\n⚠️ Test d'erreur de validation"
curl -X GET "$BASE_URL/validation" \
  -H "Accept-Language: en-US" \
  -H "Content-Type: application/json" \
  | jq '.'

# Test de pagination
echo -e "\n📄 Test de pagination"
curl -X GET "$BASE_URL/pagination" \
  -H "Accept-Language: fr-FR" \
  -H "Content-Type: application/json" \
  | jq '.'

echo -e "\n✅ Tests terminés !"
