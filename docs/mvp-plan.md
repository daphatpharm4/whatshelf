# MVP Delivery Plan (5 Weeks)

Ce document décrit un planning détaillé pour construire un MVP complet en cinq semaines avec une seule personne. Les tâches sont réparties entre trois rôles (chef de projet – **PL**, architecte cloud – **CA**, et ingénieur logiciel – **SE**) et chaque semaine inclut les tâches techniques, les tests à exécuter, les améliorations planifiées et la Definition of Done.

## Semaine 1 : Socle et gestion du catalogue

- **Tâches**
  - **PL :** définir précisément le périmètre du MVP (catalogue, panier, paiement, reçu) et la roadmap, préparer les hypothèses de pricing et de mesure de succès (orders/week/shop).
  - **CA :** configurer l’environnement local (Azure Functions, Cosmos DB, Blob/Queue via émulateurs), créer la structure Terraform de base et préparer le fichier `.env` avec les clés M‑PESA sandbox, WhatsApp Cloud et App Insights.
  - **SE :** initialiser le monorepo (workspaces pnpm, TypeScript strict, ESLint/Prettier), implémenter le squelette des fonctions API et du PWA (pages Catalogue et Produit) : routes CRUD produits/categories, gestion des médias, stockage dans Cosmos DB avec partition `merchantId`. Mettre en place Zod pour la validation, Pino pour les logs et la génération de correlation IDs.
- **Tests**
  - Tests unitaires pour les validations et le modèle produit.
  - Tests d’intégration minimalistes (création/liste produit).
- **Améliorations**
  - Instrumentation des logs JSON (correlation ID).
  - Adoption de la page hors-ligne PWA et du service worker pour le cache des assets (bonnes pratiques MDN).
- **Definition of Done**
  - Un marchand peut créer/modifier un produit via l’API.
  - Le catalogue s’affiche dans le PWA hors-ligne.
  - L’infrastructure se déploie en local via Terraform.
  - Les tests passent.

## Semaine 2 : Panier et paiement

- **Tâches**
  - **PL :** rédiger les user stories pour le parcours d’achat (ajout au panier, validation de commande, STK push).
  - **CA :** activer les comptes sandbox M‑PESA (Daraja) et WhatsApp Cloud, configurer les webhooks (tunnel ngrok ou Azure public) et documenter la sécurité (validation des signatures).
  - **SE :** implémenter le panier et l’ordre dans l’API (collections `carts` TTL et `orders`), calcul des totaux (TVA, réductions). Ajouter la page Panier et Checkout dans le PWA avec cache IndexedDB ; créer la route POST `/orders/{id}/pay` qui déclenche un STK Push. Construire un adaptateur M‑PESA (sandbox) générant un intent ID et stockant la clé d’idempotence.
- **Tests**
  - Tests unitaires sur les totaux.
  - Tests E2E simulés : création de commande et déclenchement de STK.
  - Vérifier que la PWA fonctionne hors-ligne (cache) et affiche un message clair quand le réseau est absent.
- **Améliorations**
  - Affiner les validations (Zod) pour les entrées utilisateur.
  - Intégrer une page hors-ligne personnalisée dans la PWA.
- **Definition of Done**
  - On peut ajouter des produits au panier, créer une commande, recevoir un STK Push simulé.
  - La PWA fonctionne hors-ligne (affichage des catalogues).
  - Les tests unitaires et E2E sont au vert.

## Semaine 3 : Webhooks, reçus et messagerie

- **Tâches**
  - **PL :** définir le format du reçu (PDF et message WhatsApp), rédiger les templates WhatsApp pour validation et prévoir un plan B SMS.
  - **CA :** créer les containers supplémentaires dans Cosmos DB (`payments`, `receipts`, `idempotency`), activer Azure Queue et App Insights. Documenter la gestion d’idempotence et les policies de retry.
  - **SE :** implémenter le webhook M‑PESA (POST `/webhooks/mpesa`), avec validation du schéma et insertion dans `idempotency` ; mettre à jour la commande et la collection `payments` ; si succès, publier un message dans la queue `jobs`. Créer un worker Azure Functions qui consomme ces jobs pour générer un PDF (placeholder), l’uploader dans Blob Storage et envoyer un message via WhatsApp Cloud. Ajouter le routeur des webhooks WhatsApp.
- **Tests**
  - Tests unitaires pour l’état de la commande (`PENDING_PAYMENT` → `PAID`).
  - Simulation de webhooks en double pour vérifier l’idempotence (une seule entrée).
  - Test manuel : après paiement, le client reçoit un message WhatsApp et un lien vers un PDF.
- **Améliorations**
  - Instrumentation des temps (latence STK → reçu) via App Insights.
  - Alertes sur les erreurs 5xx et la profondeur des queues.
- **Definition of Done**
  - La chaîne end-to-end fonctionne : un paiement sandbox met à jour l’ordre, envoie un reçu PDF par WhatsApp/SMS et enregistre un audit complet.
  - Les logs contiennent un correlation ID.
  - L’idempotence bloque les doublons.
  - Les métriques de latence sont disponibles.

## Semaine 4 : Tableau de bord et expérience utilisateur

- **Tâches**
  - **PL :** définir les indicateurs clés du marchand (ventes du jour, top produits, niveaux de stock), préparer le plan de prix et la stratégie de formation pour le pilote.
  - **CA :** créer des requêtes Cosmos DB et des vues pour le tableau de bord, configurer les alertes App Insights (latence, erreurs) et vérifier la conformité aux nouvelles limites WhatsApp (portfolio-based limits) afin d’éviter le throttling.
  - **SE :** développer la page Tableau de bord du marchand (PWA) qui agrège ventes, commandes en cours, alertes de stock ; ajouter l’édition des produits et un export CSV ; intégrer l’internationalisation (anglais/swahili), un mode sombre et un manifest PWA complet (icônes, couleurs). Mettre en œuvre la file d’attente hors-ligne pour enregistrer des commandes en mode kiosque et synchroniser à la reconnexion.
- **Tests**
  - Tests unitaires sur les calculs du tableau de bord.
  - Tests manuels du flux complet (création produit → commande → paiement → reçu → tableau de bord) sur plusieurs navigateurs.
  - Test de surcharge (plusieurs paiements rapprochés).
- **Améliorations**
  - Optimiser le front pour de faibles connexions (lazy loading, compression images).
  - Améliorer l’accessibilité (contrastes, navigation clavier).
  - Ajouter un service worker pour pré-cacher les pages clés.
- **Definition of Done**
  - Le marchand dispose d’une interface intuitive pour suivre les ventes et les stocks.
  - Les clients peuvent passer commande même hors-ligne et le système se synchronise.
  - L’application respecte les exigences PWA (offline, deep-links, notifications) et les limites de la plateforme WhatsApp.

## Semaine 5 : Durcissement, conformité et préparation de la présentation

- **Tâches**
  - **PL :** planifier les tests utilisateurs avec 1‑2 marchands pilotes, recueillir les retours et préparer la démo (scénario, KPI, argumentaire business). Rédiger la documentation utilisateur et technique.
  - **CA :** sécuriser les secrets (Key Vault), configurer le déploiement en staging et production via GitHub Actions, vérifier la résilience (backups Cosmos DB, failover, quotas). Mettre en conformité le Data Processing Agreement et la politique de confidentialité.
  - **SE :** finaliser les fonctionnalités secondaires (coupons, notes de commandes), écrire un guide d’onboarding (seed script, QR code), corriger les bugs remontés lors des tests. Mettre en place un endpoint `/health` et des sondes de canary pour surveiller la chaîne paiement → reçu.
- **Tests**
  - Exécuter une batterie de tests d’acceptation avec les marchands pilotes.
  - Simuler des pannes (webhook en retard, réseau perdu) et vérifier la récupération automatique.
  - Exécuter un audit de sécurité (OWASP Top 10) et valider l’accessibilité.
- **Améliorations**
  - Ajuster la gestion des quotas WhatsApp suite au nouveau modèle de limites (messages agrégés par portfolio).
  - Mettre en cache le PDF sur CDN pour optimiser l’ouverture.
  - Optimiser le worker (gestion du DLQ).
- **Definition of Done**
  - Le produit est déployable sur Azure avec configuration en un clic, les scripts d’amorçage fonctionnent.
  - La démonstration se déroule sans faille (création d’une boutique, commande, paiement, réception du reçu, consultation du tableau de bord).
  - La présentation est prête avec des slides claires et des métriques réelles (latence, taux de réussite > 96 %).

## Notes sur les plateformes 2025

- **M‑PESA Fintech 2.0** : tirer parti de la capacité et de la fiabilité accrues pour soutenir les pics de transactions, en prévoyant des tests de charge hebdomadaires.
- **PWA 2025** : implémenter un service worker robuste, une page hors-ligne, des liens profonds et un manifest complet pour respecter les bonnes pratiques.
- **WhatsApp (7 octobre 2025)** : gérer les quotas de messages par portfolio, monitorer la consommation et prévoir un fallback (SMS ou e-mail) en cas de saturation.

Ce plan garantit un MVP robuste et présentable, aligné sur les évolutions des plateformes et les meilleures pratiques de développement, de sécurité et d’expérience utilisateur.
