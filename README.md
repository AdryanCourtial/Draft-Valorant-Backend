# Valorant Draft - API

Ce dépôt contient l’API backend de l’application **Valorant Draft**.

---

## ⚙️ Installation

1. Installe les dépendances :

```bash
npm install
```

2. Génère le client Prisma :

```bash
npx prisma generate
```

---

## 🗄️ Synchroniser la base de données

Pour créer ou mettre à jour les tables **sans historique de migration** :

```bash
npx prisma db push
```

3. Remplis la base avec les données de test :

```bash
npx ts-node prisma/seed.ts
```

Run le project

```
npm run dev
```

---

## 📜 Documentation Swagger

Accède à la documentation de l’API :

[http://localhost:3000/api/api-docs/](http://localhost:3000/api/api-docs/)

---

## 🔑 Variables d’environnement

Crée un fichier `.env` à la racine du projet avec le contenu suivant :

```env
DATABASE_URL="mysql://root@localhost:3306/valorant_draft"
JWT_SECRET="ton_jwt_secret"
FRONT_URL="http://localhost:5173"
NODE_ENV="development"
```

---

## ✅ Bon à savoir

- **Prisma** est utilisé pour gérer la base MySQL.
- **Swagger** est disponible à `/api-docs/` pour explorer les endpoints.
