# Ledger (Node.js + SQLite + React)

Production-ready ledger app with:
- **Backend:** Node.js + Express
- **Database:** SQLite (`data/app.db`)
- **Frontend:** React + Vite (served by backend from `src/frontend/dist`)

---

## 1) What you need before going live

### Server requirements
- Ubuntu 22.04/24.04 (or any Linux distro with Node support)
- 1 vCPU / 1 GB RAM minimum (2 GB RAM recommended)
- A public domain (recommended) or public IP
- Open ports:
  - `22` (SSH)
  - `80` (HTTP)
  - `443` (HTTPS)

### Software requirements
- Node.js **18+** (Node 20 LTS recommended)
- npm
- PM2 (for process supervision)
- Nginx (reverse proxy)
- Certbot (TLS/HTTPS)

---

## 2) Project structure (important paths)

```text
backend-server.js          # Entry point (imports src/backend/server.js)
src/backend/               # Express API, auth, routes, DB migrations
src/frontend/              # React frontend source
src/frontend/dist/         # Built frontend assets served by backend
data/app.db                # SQLite database file (created automatically)
```

---

## 3) Environment variables (required for production)

Create a `.env` file in repo root:

```env
NODE_ENV=production
PORT=3001
JWT_SECRET=replace_with_a_long_random_secret
ALLOWED_ORIGIN=https://your-domain.com
```

### Notes
- `JWT_SECRET` must be strong and private.
- `ALLOWED_ORIGIN` should be your exact frontend origin (no trailing slash).
- If you host multiple frontend origins, handle this with a custom CORS strategy before production.

---

## 4) First-time server setup (Ubuntu)

### 4.1 Install Node.js 20 LTS, Nginx, PM2, Certbot

```bash
sudo apt update
sudo apt install -y curl git nginx certbot python3-certbot-nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
node -v
npm -v
pm2 -v
```

### 4.2 Clone and install app

```bash
git clone <YOUR_REPO_URL> Ledger
cd Ledger
npm install
npm run install:frontend
```

### 4.3 Build frontend

```bash
npm run build:frontend
```

### 4.4 Create production env file

```bash
cat > .env << 'EOF'
NODE_ENV=production
PORT=3001
JWT_SECRET=replace_with_a_long_random_secret
ALLOWED_ORIGIN=https://your-domain.com
EOF
```

### 4.5 Smoke test directly on server

```bash
set -a
source .env
set +a
npm start
```

Open from server (or another terminal):

```bash
curl -sS http://127.0.0.1:3001/health
```

Expected:

```json
{"ok":true}
```

Stop server with `Ctrl + C`.

---

## 5) Run app permanently with PM2

```bash
cd /path/to/Ledger
pm2 start npm --name ledger -- start
pm2 save
pm2 startup
```

Run the command that `pm2 startup` prints.

Useful PM2 commands:

```bash
pm2 status
pm2 logs ledger
pm2 restart ledger
pm2 stop ledger
```

---

## 6) Configure Nginx reverse proxy

Create Nginx site config:

```bash
sudo nano /etc/nginx/sites-available/ledger
```

Paste:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/ledger /etc/nginx/sites-enabled/ledger
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7) Enable HTTPS (Let’s Encrypt)

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Verify auto-renew:

```bash
sudo certbot renew --dry-run
```

After this, your app should be live at:
- `https://your-domain.com`

---

## 8) Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

---

## 9) Updating after new code push

```bash
cd /path/to/Ledger
git pull
npm install
npm run install:frontend
npm run build:frontend
pm2 restart ledger
```

---

## 10) Mobile app (installed APK/IPA) API setup

For mobile builds, API base URL must be reachable by the device:
- Prefer HTTPS backend URL (recommended)
- Build-time env option:
  - `VITE_API_URL=https://your-domain.com`
- Runtime option in app:
  - On login screen (native app), open **Configure server URL**
  - Set: `https://your-domain.com`

---

## 11) Production verification checklist

Run these checks after go-live:

```bash
# API health through domain
curl -sS https://your-domain.com/health

# Nginx status
sudo systemctl status nginx --no-pager

# App process
pm2 status

# TLS cert validity
sudo certbot certificates
```

App-level checks:
- Signup works
- Login works
- Add customer / product works
- CSV import/export works
- App reload keeps data (SQLite persisted)

---

## 12) Common issues and fixes

### App works locally but not from domain
- Check `ALLOWED_ORIGIN` in `.env`
- Check Nginx `server_name` and DNS records
- Check `pm2 logs ledger`

### Mobile app cannot login/signup
- Ensure app server URL is set to reachable HTTPS endpoint
- Ensure backend health is reachable from phone:
  - `https://your-domain.com/health`

### 502 Bad Gateway in Nginx
- Backend not running:
  - `pm2 restart ledger`
  - check `pm2 logs ledger`

### JWT startup error in production
- Set `JWT_SECRET` in `.env` and restart PM2

---

## 13) API compatibility

Backend API route:
- `POST /api/backend/:method`

Supported methods include:
- Customers: `addCustomer`, `updateCustomer`, `deleteCustomer`, `getAllCustomers`, `searchCustomers`
- Products: `addProduct`, `updateProduct`, `deleteProduct`, `getAllProducts`, `searchProducts`, `bulkImportProducts`
- Transactions: `addTransaction`, `addBatchTransaction`, `deleteTransaction`, `getTransactionsForCustomer`
- Analytics: `getCustomerBalanceSummary`, `getCustomersSortedByBalance`, `getHighBalanceCustomers`, `getInactiveCustomers`

---

## 14) Quick local run (developer shortcut)

```bash
npm install
npm run install:frontend
npm run build:frontend
npm start
```

Then open:
- `http://localhost:3001`
