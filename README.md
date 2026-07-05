# ShopManager 🛒📱

ShopManager est une solution numérique intégrée de gestion de boutique, de stock et de services Fintech (ventes de crédits télécoms et transactions Mobile Money : M-PESA, Orange Money, Airtel Money). Elle permet de centraliser le suivi des flux de trésorerie (caisses matin et soir), le contrôle rigoureux des dettes clients, et l'ajustement dynamique des balances financières.

L'écosystème est divisé en trois parties majeures :
* **Backend (`/backend`)** : API REST puissante développée avec Laravel 11.
* **Frontend Web (`/frontend-web`)** : Tableau de bord d'administration et de gestion de stock développé en Next.js 14 (App Router).
* **Application Mobile (`/mobile`)** : Application client/agent de terrain développée en React Native via Expo.

---

## ✨ Fonctionnalités Clés

* **📊 Gestion de Caisse & Clôtures (Session-based)** : Déclaration de caisse matin/soir (liquide + balances virtuelles), calcul automatique du solde théorique attendu et système de verrouillage (clôture) imperméable pour figer la journée comptable.
* **📱 Fintech & Mobile Money Ledger** : Suivi en temps réel des dépôts et retraits par opérateur (M-PESA, Orange Money, Airtel Money) avec calcul automatique et rétroactif des soldes successifs lors de modifications.
* **🔢 Règle Métier Télécom stricte** : Intégration native des ratios d'unités (ex: $30\,000 \text{ FC} = 1\,324 \text{ unités}$).
* **📦 Suivi des Stocks & Ventes** : Inventaire des articles en boutique, alertes de rupture, et enregistrement fluide des entrées et sorties de marchandises.
* **📋 Grand Livre des Dettes** : Suivi des ardoises clients avec modules de paiements/remboursements partiels ou totaux.
* **🌓 Interface Adaptative** : Support complet et dynamique du Mode Sombre (Dark Mode) et Clair (Light Mode) basé sur les préférences du système utilisateur.

---

## 🛠️ Stack Technique

* **Backend** : PHP 11 (Laravel), MySQL/PostgreSQL, Laravel Sanctum (Authentification), Spatie Permissions.
* **Frontend Web** : React 18, Next.js 14, Tailwind CSS, Shadcn/ui, TypeScript.
* **Application Mobile** : React Native, Expo, Axios, TanStack Query (React Query) pour la synchronisation et le cache asynchrone, StyleSheet étendu.

---

Chartes Graphiques & UX Guidelines

Les interfaces suivent une logique stricte d'ergonomie mobile et web :
* **Accessibilité Tactile : Zones de clics et boutons de formulaires calibrés à une hauteur minimale de 48px.**
* **Colorimétrie Principale : Combinaisons de Bleu Profond (#1E3A8A), Vert Success (#16A34A), et touches de Cuivre/Or (#B45309) pour une UI propre et professionnelle orientée Fintech.**

---

## 👥 Auteur
* **Siméon Gédéon Kimbungu - Développeur Full-Stack & Concepteur - GitHub**

---

## 🚀 Installation & Démarrage Rapide

### 1. Cloner le projet
```bash
git clone [https://github.com/SimeonGedeon/ShopManager.git](https://github.com/SimeonGedeon/ShopManager.git)
cd ShopManager

## Configurer le Backend (Laravel 11)
Bash

cd backend
composer install
cp .env.example .env
php artisan key:generate
# Configurez vos accès base de données dans le .env
php artisan migrate --seed
php artisan storage:link
php artisan serve
