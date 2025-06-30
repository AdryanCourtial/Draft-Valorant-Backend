# Valorant Draft API

## Installation

1. Installer les dépendances :

```bash
npm i

npx prisma generate

npx ts-node prisma/seed.ts

```

## Ajouter les tables en base sans historique
```
npx prisma db push
```

## Voir le swagger

```
http://localhost:3000/api-docs/
```

## Fichier Env

```
DATABASE_URL="mysql://root@localhost:3306/valorant_draft"
JWT_SECRET="ton_jwt_secret"
FRONT_URL="http://localhost:5173"

```
