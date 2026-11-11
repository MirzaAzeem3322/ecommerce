# E-commerce Store — Next.js + Express + PostgreSQL

A complete online store:

- **frontend/** — Next.js 15 (App Router) + Tailwind CSS
- **backend/** — Node.js + Express 5 REST API, Prisma ORM
- **PostgreSQL** — database (run it with Docker or your own install)

## Features

**Customers**
- Home page with categories, featured products and new arrivals
- Shop page with search, category filter, sorting and pagination
- Product pages with stock status and related products
- Cart (saved in the browser, works before logging in)
- Sign up / log in (JWT)
- Checkout with shipping details and **Cash on Delivery** or **card payment (Stripe)**
- Order history, order details, cancel a pending order

**Admin** (`/admin`)
- Dashboard: revenue, order counts, low-stock alerts, recent orders
- Products: add, edit, delete, search
- Categories: add, rename, delete
- Orders: filter by status, update status (cancelling puts stock back)
- Customers list

**Backend safety**
- Prices are always taken from the database, never from the browser
- Stock is checked and reduced inside a database transaction (no overselling)
- Passwords hashed with bcrypt, input validated with zod, Helmet + CORS

---

## 1. Requirements

- **Node.js 20+** — https://nodejs.org
- **PostgreSQL 14+** — either:
  - **Docker Desktop** (easiest): the included `docker-compose.yml` starts Postgres for you, or
  - PostgreSQL installed on Windows: https://www.postgresql.org/download/windows/

## 2. Start the database

**With Docker** (from `C:\ecommerce`):

```bash
docker compose up -d
```

**Without Docker:** open pgAdmin or `psql` and create a database named `ecommerce`.

## 3. Configure environment files

```bash
# Windows (Command Prompt)
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env.local
```

```bash
# macOS / Linux / Git Bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

Open `backend/.env` and check:
- `DATABASE_URL` — matches your Postgres user, password and database
  (the default works with the Docker setup)
- `JWT_SECRET` — change it to any long random string

## 4. Install, create tables, add sample data

From `C:\ecommerce`:

```bash
npm run install:all
npm run db:migrate      # when asked for a migration name, type: init
npm run db:seed
```

The seed creates 4 categories, 16 sample products and two accounts:

| Role     | Email                  | Password      |
|----------|------------------------|---------------|
| Admin    | admin@example.com      | admin123      |
| Customer | customer@example.com   | customer123   |

## 5. Run it

```bash
npm run dev
```

- Store: http://localhost:3000
- Admin: http://localhost:3000/admin (log in as the admin)
- API: http://localhost:5000/api/health

You can also run each part separately: `cd backend && npm run dev` and `cd frontend && npm run dev`.

---

## Card payments with Stripe (optional)

Cash on Delivery works out of the box. To accept cards:

1. Create a Stripe account and copy your **test secret key** (`sk_test_...`) into `STRIPE_SECRET_KEY` in `backend/.env`.
2. Set `CURRENCY` (e.g. `usd`) in `backend/.env` and the matching `NEXT_PUBLIC_CURRENCY` (e.g. `USD`) in `frontend/.env.local`.
3. Forward webhooks to your local API with the Stripe CLI:
   ```bash
   stripe listen --forward-to localhost:5000/api/payments/webhook
   ```
   Copy the `whsec_...` value it prints into `STRIPE_WEBHOOK_SECRET`.
4. Restart the backend. "Credit / Debit card" now appears at checkout. Test card: `4242 4242 4242 4242`, any future date, any CVC.

When Stripe confirms payment the order changes to **Paid**. If the payment page expires unpaid, the order is cancelled and stock is restored.

> Note: Stripe is not available for merchants in every country. If it isn't available where you are, keep Cash on Delivery or swap in a local gateway in `backend/src/services/orders.js`.

---

## Project structure

```
ecommerce/
├── docker-compose.yml        PostgreSQL for local development
├── package.json              runs backend + frontend together
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma     database tables
│   │   └── seed.js           sample data
│   └── src/
│       ├── index.js          starts the server
│       ├── app.js            Express app and routes
│       ├── config.js         environment settings
│       ├── middleware/       auth, validation, errors
│       ├── routes/           auth, products, categories, orders, admin, payments
│       └── services/orders.js  order creation, stock, Stripe
└── frontend/
    ├── app/                  pages (shop, product, cart, checkout, orders, admin…)
    ├── components/           Navbar, ProductCard, ProductForm…
    ├── context/              Auth and Cart state
    └── lib/                  API client and formatting helpers
```

## API reference

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account |
| POST | `/api/auth/login` | Public | Log in, returns token |
| GET | `/api/auth/me` | User | Current user |
| GET | `/api/products` | Public | List (`search`, `category`, `featured`, `sort`, `page`, `limit`) |
| GET | `/api/products/:slugOrId` | Public | Product + related |
| POST/PUT/DELETE | `/api/products[/:id]` | Admin | Manage products |
| GET | `/api/categories` | Public | List categories |
| POST/PUT/DELETE | `/api/categories[/:id]` | Admin | Manage categories |
| POST | `/api/orders` | User | Place order |
| GET | `/api/orders/mine` | User | My orders |
| GET | `/api/orders/:id` | Owner/Admin | Order details |
| POST | `/api/orders/:id/cancel` | Owner | Cancel pending order |
| POST | `/api/orders/:id/pay` | Owner | Retry card payment |
| GET | `/api/admin/stats` | Admin | Dashboard numbers |
| GET | `/api/admin/orders` | Admin | All orders (`status`, `page`) |
| PATCH | `/api/admin/orders/:id/status` | Admin | Change order status |
| GET | `/api/admin/users` | Admin | Customers |
| GET | `/api/payments/config` | Public | Is card payment enabled |
| POST | `/api/payments/webhook` | Stripe | Payment events |

Send the token as `Authorization: Bearer <token>`.

## Common problems

- **"Cannot reach the server"** on the site → the backend isn't running, or `NEXT_PUBLIC_API_URL` is wrong.
- **`P1001: Can't reach database server`** → Postgres isn't running or `DATABASE_URL` is wrong.
- **CORS error** → `CLIENT_URL` in `backend/.env` must match the address of the frontend.
- **Changed shipping fee?** Update it in both `backend/src/services/orders.js` and `frontend/lib/format.js`.
- **Going live:** set a strong `JWT_SECRET`, change the admin password, use `npm run db:deploy` for migrations, and run `npm run build && npm start` in `frontend`.
