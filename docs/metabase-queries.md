--
=====================================================================================================
-- REQUÊTES MONGODB PRÉDÉFINIES POUR METABASE --
=====================================================================================================
-- Collection de requêtes optimisées pour les KPIs business d'Aze Farm -- À
copier dans l'éditeur de requêtes SQL de Metabase --
=====================================================================================================

--
================================================================================================
-- KPIs BUSINESS GÉNÉRAUX --
================================================================================================

-- 1. Chiffre d'affaires journalier (30 derniers jours) SELECT DATE(orderDate)
as date, SUM(totalAmount) as revenue, COUNT(\*) as order_count, AVG(totalAmount)
as avg_order_value FROM orders WHERE status != 'CANCELLED' AND orderDate >=
DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY DATE(orderDate) ORDER BY date DESC

-- 2. Chiffre d'affaires mensuel (12 derniers mois) SELECT
DATE_FORMAT(orderDate, '%Y-%m') as month, SUM(totalAmount) as revenue, COUNT(\*)
as order_count, AVG(totalAmount) as avg_order_value FROM orders WHERE status !=
'CANCELLED' AND orderDate >= DATE_SUB(NOW(), INTERVAL 12 MONTH) GROUP BY
DATE_FORMAT(orderDate, '%Y-%m') ORDER BY month DESC

-- 3. Répartition des méthodes de paiement (30 derniers jours) SELECT method,
COUNT(_) as payment_count, SUM(amount) as total_amount, AVG(amount) as
avg_amount, (COUNT(_) _ 100.0 / (SELECT COUNT(_) FROM mobile_payments WHERE
status = 'COMPLETED' AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY))) as
percentage FROM mobile_payments WHERE status = 'COMPLETED' AND createdAt >=
DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY method ORDER BY payment_count DESC

-- 4. Taux de conversion panier → commande (30 derniers jours) SELECT COUNT(CASE
WHEN status = 'CONVERTED' THEN 1 END) as converted_carts, COUNT(CASE WHEN status
= 'ABANDONED' THEN 1 END) as abandoned_carts, COUNT(_) as total_carts,
ROUND(COUNT(CASE WHEN status = 'CONVERTED' THEN 1 END) _ 100.0 / COUNT(\*), 2)
as conversion_rate FROM carts WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30
DAY)

--
================================================================================================
-- ANALYSE UTILISATEURS --
================================================================================================

-- 5. Utilisateurs actifs par jour (30 derniers jours) SELECT
DATE(last_login_at) as date, COUNT(\*) as active_users, COUNT(CASE WHEN role =
'CONSUMER' THEN m.com1 END) as active_consumers, COUNT(CASE WHEN role = 'FARMER'
THEN 1 END) as active_farmers FROM users WHERE last_login_at >= DATE_SUB(NOW(),
INTERVAL 30 DAY) AND is_active = true GROUP BY DATE(last_login_at) ORDER BY date
DESC

-- 6. Répartition des rôles utilisateurs SELECT role, COUNT(_) as total_users,
COUNT(CASE WHEN is_verified = true THEN 1 END) as verified_users, COUNT(CASE
WHEN is_active = true THEN 1 END) as active_users, ROUND(COUNT(_) _ 100.0 /
(SELECT COUNT(_) FROM users), 2) as percentage FROM users WHERE is_deleted =
false GROUP BY role

-- 7. Nouveaux utilisateurs par mois (12 derniers mois) SELECT
DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(\*) as new_users, COUNT(CASE
WHEN role = 'CONSUMER' THEN 1 END) as new_consumers, COUNT(CASE WHEN role =
'FARMER' THEN 1 END) as new_farmers FROM users WHERE created_at >=
DATE_SUB(NOW(), INTERVAL 12 MONTH) AND is_deleted = false GROUP BY
DATE_FORMAT(created_at, '%Y-%m') ORDER BY month DESC

-- 8. Taux de vérification email SELECT COUNT(CASE WHEN is_verified = true THEN
1 END) as verified_users, COUNT(CASE WHEN is_verified = false THEN 1 END) as
unverified_users, COUNT(_) as total_users, ROUND(COUNT(CASE WHEN is_verified =
true THEN 1 END) _ 100.0 / COUNT(\*), 2) as verification_rate FROM users WHERE
is_deleted = false AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)

--
================================================================================================
-- PERFORMANCE FERMES --
================================================================================================

-- 9. Top 10 fermes par chiffre d'affaires (30 derniers jours) SELECT f.name as
farm_name, f.ratingAvg as rating, COUNT(o.\_id) as order_count,
SUM(o.totalAmount) as revenue, AVG(o.totalAmount) as avg_order_value FROM farms
f JOIN orders o ON f.\_id = o.farmId WHERE o.status != 'CANCELLED' AND
o.orderDate >= DATE_SUB(NOW(), INTERVAL 30 DAY) AND f.isActive = true GROUP BY
f.\_id, f.name, f.ratingAvg ORDER BY revenue DESC LIMIT 10

-- 10. Top 10 fermes par note moyenne SELECT name, ratingAvg as rating,
ratingCount as review_count, isActive FROM farms WHERE isActive = true AND
ratingCount > 0 ORDER BY ratingAvg DESC, ratingCount DESC LIMIT 10

-- 11. Nombre de produits par ferme SELECT f.name as farm_name, COUNT(p.\_id) as
product_count, COUNT(CASE WHEN p.isAvailable = true THEN 1 END) as
available_products, SUM(p.stock) as total_stock, AVG(p.price) as avg_price FROM
farms f LEFT JOIN products p ON f.\_id = p.farmId WHERE f.isActive = true GROUP
BY f.\_id, f.name ORDER BY product_count DESC

-- 12. Répartition géographique des fermes SELECT CASE WHEN geoLocation.latitude
BETWEEN 3.5 AND 4.5 AND geoLocation.longitude BETWEEN 11.0 AND 13.0 THEN
'Centre' WHEN geoLocation.latitude BETWEEN 2.0 AND 3.5 AND geoLocation.longitude
BETWEEN 9.0 AND 11.0 THEN 'Ouest' WHEN geoLocation.latitude BETWEEN 4.5 AND 7.0
AND geoLocation.longitude BETWEEN 13.0 AND 16.0 THEN 'Est' WHEN
geoLocation.latitude BETWEEN 1.0 AND 2.0 AND geoLocation.longitude BETWEEN 13.0
AND 16.0 THEN 'Sud' ELSE 'Autre' END as region, COUNT(\*) as farm_count,
AVG(ratingAvg) as avg_rating FROM farms WHERE isActive = true AND geoLocation IS
NOT NULL GROUP BY region ORDER BY farm_count DESC

--
================================================================================================
-- ANALYSE PRODUITS --
================================================================================================

-- 13. Produits les plus vendus (30 derniers jours) SELECT p.name as
product_name, p.category, f.name as farm_name, SUM(oi.quantity) as
total_quantity, SUM(oi.subtotal) as revenue, COUNT(DISTINCT o.\_id) as
order_count FROM products p JOIN order_items oi ON p.\_id = oi.productId JOIN
orders o ON oi.orderId = o.\_id JOIN farms f ON p.farmId = f.\_id WHERE o.status
!= 'CANCELLED' AND o.orderDate >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY
p.\_id, p.name, p.category, f.name ORDER BY total_quantity DESC LIMIT 20

-- 14. Catégories de produits les plus populaires SELECT category, COUNT(\*) as
product_count, COUNT(CASE WHEN isAvailable = true THEN 1 END) as
available_count, AVG(price) as avg_price, SUM(stock) as total_stock FROM
products WHERE isAvailable = true GROUP BY category ORDER BY product_count DESC

-- 15. Produits en rupture de stock SELECT p.name as product_name, p.category,
f.name as farm_name, p.price, p.last_updated as last_stock_update FROM products
p JOIN farms f ON p.farmId = f.\_id WHERE p.stock = 0 AND p.isAvailable = true
AND f.isActive = true ORDER BY p.updatedAt DESC

-- 16. Analyse de saisonnalité des produits SELECT category, COUNT(\*) as
product_count, AVG(CASE WHEN 6 IN (seasonality) OR 7 IN (seasonality) OR 8 IN
(seasonality) THEN 1 ELSE 0 END) as summer_seasonal, AVG(CASE WHEN 12 IN
(seasonality) OR 1 IN (seasonality) OR 2 IN (seasonality) THEN 1 ELSE 0 END) as
winter_seasonal FROM products WHERE isAvailable = true AND seasonality IS NOT
NULL AND LENGTH(JSON_ARRAY(seasonality)) > 2 GROUP BY category ORDER BY
product_count DESC

--
================================================================================================
-- ANALYSE COMMANDES ET PAIEMENTS --
================================================================================================

-- 17. Statistiques des commandes par statut (30 derniers jours) SELECT status,
COUNT(_) as order_count, SUM(totalAmount) as total_amount, AVG(totalAmount) as
avg_amount, ROUND(COUNT(_) _ 100.0 / (SELECT COUNT(_) FROM orders WHERE
orderDate >= DATE_SUB(NOW(), INTERVAL 30 DAY)), 2) as percentage FROM orders
WHERE orderDate >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY status ORDER BY
order_count DESC

-- 18. Taux d'échec des paiements (30 derniers jours) SELECT COUNT(CASE WHEN
status = 'COMPLETED' THEN 1 END) as successful_payments, COUNT(CASE WHEN status
= 'FAILED' THEN 1 END) as failed_payments, COUNT(_) as total_payments,
ROUND(COUNT(CASE WHEN status = 'FAILED' THEN 1 END) _ 100.0 / COUNT(\*), 2) as
failure_rate, SUM(CASE WHEN status = 'COMPLETED' THEN amount ELSE 0 END) as
successful_amount, SUM(CASE WHEN status = 'FAILED' THEN amount ELSE 0 END) as
failed_amount FROM mobile_payments WHERE createdAt >= DATE_SUB(NOW(), INTERVAL
30 DAY)

-- 19. Panier moyen (AOV) par jour (30 derniers jours) SELECT DATE(orderDate) as
date, AVG(totalAmount) as avg_order_value, COUNT(\*) as order_count,
MIN(totalAmount) as min_order, MAX(totalAmount) as max_order FROM orders WHERE
status != 'CANCELLED' AND orderDate >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY
DATE(orderDate) ORDER BY date DESC

-- 20. Distribution des montants de commandes SELECT CASE WHEN totalAmount <
1000 THEN '0-1000' WHEN totalAmount < 5000 THEN '1000-5000' WHEN totalAmount <
10000 THEN '5000-10000' WHEN totalAmount < 20000 THEN '10000-20000' ELSE
'20000+' END as amount_range, COUNT(_) as order_count, SUM(totalAmount) as
total_amount, ROUND(COUNT(_) _ 100.0 / (SELECT COUNT(_) FROM orders WHERE status
!= 'CANCELLED'), 2) as percentage FROM orders WHERE status != 'CANCELLED' GROUP
BY amount_range ORDER BY MIN(totalAmount)

--
================================================================================================
-- ANALYSE RECHERCHE ET COMPORTEMENT --
================================================================================================

-- 21. Termes de recherche les plus populaires (30 derniers jours) SELECT
searchTerm, COUNT(\*) as search_count, AVG(resultCount) as avg_results,
AVG(responseTime) as avg_response_time_ms FROM search_analytics WHERE
createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY) GROUP BY searchTerm ORDER BY
search_count DESC LIMIT 20

-- 22. Performance des recherches par type SELECT searchType, COUNT(\*) as
search_count, AVG(resultCount) as avg_results, AVG(responseTime) as
avg_response_time_ms, MIN(responseTime) as min_response_time, MAX(responseTime)
as max_response_time FROM search_analytics WHERE createdAt >= DATE_SUB(NOW(),
INTERVAL 30 DAY) GROUP BY searchType ORDER BY search_count DESC

-- 23. Paniers abandonnés par valeur (7 derniers jours) SELECT CASE WHEN
totalAmount < 1000 THEN '0-1000' WHEN totalAmount < 5000 THEN '1000-5000' WHEN
totalAmount < 10000 THEN '5000-10000' WHEN totalAmount < 20000 THEN
'10000-20000' ELSE '20000+' END as value_range, COUNT(\*) as abandoned_count,
SUM(totalAmount) as lost_revenue, AVG(totalAmount) as avg_cart_value FROM carts
WHERE status = 'ABANDONED' AND createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY value_range ORDER BY MIN(totalAmount)

--
================================================================================================
-- MÉTRIQUES OPÉRATIONNELLES --
================================================================================================

-- 24. Temps moyen de traitement des commandes SELECT AVG(TIMESTAMPDIFF(HOUR,
orderDate, CASE WHEN status = 'DELIVERED' THEN updatedAt WHEN status IN
('CONFIRMED', 'PREPARING', 'READY') THEN updatedAt ELSE NOW() END )) as
avg_processing_hours, COUNT(\*) as total_orders FROM orders WHERE orderDate >=
DATE_SUB(NOW(), INTERVAL 30 DAY) AND status != 'CANCELLED'

-- 25. Utilisation des filtres de recherche SELECT JSON_EXTRACT_STRING(filters,
'$.category') as category_filter,
  COUNT(*) as usage_count,
  AVG(resultCount) as avg_results
FROM search_analytics 
WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
AND filters IS NOT NULL
AND JSON_EXTRACT_STRING(filters, '$.category')
IS NOT NULL GROUP BY JSON_EXTRACT_STRING(filters, '$.category') ORDER BY
usage_count DESC LIMIT 10

--
================================================================================================
-- NOTES D'UTILISATION --
================================================================================================

/\* INSTRUCTIONS POUR METABASE :

1. Copiez chaque requête dans l'éditeur SQL de Metabase
2. Vérifiez que les noms de collections correspondent exactement
3. Adaptez les intervalles de temps selon vos besoins
4. Certaines requêtes utilisent des fonctions SQL qui peuvent nécessiter des
   ajustements pour MongoDB
5. Pour les requêtes géographiques, assurez-vous que les coordonnées sont
   correctement formatées

FONCTIONS MONGODB À CONNAÎTRE :

- DATE_SUB() → $dateSubtract (agrégation)
- DATE_FORMAT() → $dateToString (agrégation)
- ROUND() → $round (agrégation)
- CASE WHEN → $cond (agrégation)

PERFORMANCES :

- Ajoutez des index sur les champs fréquemment filtrés (created_at, status,
  etc.)
- Utilisez $match tôt dans les pipelines d'agrégation
- Limitez les résultats avec LIMIT pour les dashboards \*/
