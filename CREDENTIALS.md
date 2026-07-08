# EventHub — Credentials Reference

> **Keep this file private. Do not share publicly.**

---

## Super Admin (Platform Owner)

| Field    | Value                            |
|----------|----------------------------------|
| URL      | `/superadmin/login`              |
| Email    | `nuwandarshana2012@gmail.com`    |
| Password | `Password@123`                   |

The super admin account is seeded by running:
```bash
cd server
npm run seed
```

---

## MongoDB Atlas

| Field | Value |
|-------|-------|
| User  | `nuwandarshana2012` |
| Pass  | `3xN84aUCYCEnvKWL`  |
| DB    | `eventMgt`          |

Connection string is in `server/.env` → `MONGODB_URI`.

---

## Cloudinary

| Field      | Value               |
|------------|---------------------|
| Cloud Name | `dpv3xkuuz`         |
| API Key    | `311255474888743`   |
| API Secret | `SlQE00T3sbyxYeOrMrukrTB44CU` |

---

## JWT

| Field      | Value                                      |
|------------|--------------------------------------------|
| Secret     | `your_super_secret_jwt_key_change_this_in_production` |
| Expires In | `7d`                                       |

> Change the JWT secret before deploying to production.
