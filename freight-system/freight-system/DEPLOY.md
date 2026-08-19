# 部署教學（免費方案：Vercel + Neon）

這份教學讓你不需要懂程式，也能把系統放到雲端，讓老闆和會計可以在任何地方用瀏覽器登入使用。全程約 15-20 分鐘，且免費額度對 1-3 人使用完全足夠。

## 第一步：建立雲端資料庫（Neon）

1. 前往 https://neon.tech ，用 Google 或 Email 註冊一個免費帳號。
2. 建立一個新專案（Project），資料庫名稱可以直接用預設值。
3. 建立完成後，找到 **Connection string**（連線字串），會長得像：
   `postgresql://使用者:密碼@ep-xxxx.aws.neon.tech/dbname?sslmode=require`
4. 複製這串文字，稍後會用到（這就是 `DATABASE_URL`）。

## 第二步：把程式碼放到 GitHub

1. 前往 https://github.com 註冊帳號（如果還沒有的話）。
2. 建立一個新的 Repository（可以設為 Private，只有你自己看得到）。
3. 把我們提供的專案資料夾（解壓縮後）上傳到這個 Repository。最簡單的方式：
   - 在 GitHub 網頁上點「uploading an existing file」，把整個資料夾拖進去上傳；或
   - 如果你的電腦有安裝 Git，可以用命令列：
     ```bash
     cd freight-system
     git init
     git add .
     git commit -m "init"
     git branch -M main
     git remote add origin https://github.com/你的帳號/你的repo.git
     git push -u origin main
     ```

## 第三步：部署到 Vercel

1. 前往 https://vercel.com ，用 GitHub 帳號登入（免費）。
2. 點選 **Add New → Project**，選擇剛剛上傳的 Repository，點 Import。
3. 在部署設定畫面，展開 **Environment Variables**，新增以下兩筆：
   - `DATABASE_URL` = 第一步複製的 Neon 連線字串
   - `JWT_SECRET` = 自己輸入一串隨機英數字（例如用密碼產生器產生 32 個字元），這是用來加密登入狀態的密鑰，請勿外洩
4. 點擊 **Deploy**，等待約 1-2 分鐘完成部署。
5. 部署完成後，Vercel 會給你一個網址，例如 `https://freight-system-xxxx.vercel.app`，這就是之後大家登入使用的網址。

## 第四步：初始化資料表與管理者帳號

因為資料庫是全新的，需要先建立資料表結構，並建立第一個登入帳號。在你自己的電腦上（有安裝 Node.js 的情況下）：

```bash
cd freight-system
npm install
# 建立 .env 檔案，內容填入跟 Vercel 一樣的 DATABASE_URL
echo 'DATABASE_URL="貼上你的 Neon 連線字串"' > .env
npm run db:push     # 建立資料表
npm run db:seed     # 建立管理者帳號 admin@example.com / admin1234
```

也可以在建立帳號時自訂 Email 和密碼：

```bash
SEED_ADMIN_EMAIL="老闆的email@example.com" SEED_ADMIN_PASSWORD="設定一個密碼" SEED_ADMIN_NAME="老闆" npm run db:seed
```

## 第五步：開始使用

1. 打開 Vercel 給你的網址。
2. 用剛剛建立的帳號密碼登入。
3. 登入後建議先到「帳號管理」新增會計的帳號，並可考慮之後修改自己的密碼（未來可加入修改密碼功能）。

## 之後更新系統

以後如果請人幫忙新增功能（例如支票登記簿、車輛管理等），只要把新的程式碼推送到 GitHub 的 main 分支，Vercel 會自動重新部署，網址不會改變，資料也不會遺失（資料都存在 Neon 資料庫，跟程式碼是分開的）。

## 費用說明

- Vercel 免費方案（Hobby）：個人/ 小型專案免費，足夠 1-3 人日常使用。
- Neon 免費方案：有一定的儲存空間與運算時數上限，對這個系統的資料量（帳務記錄）來說通常綽綽有餘；未來資料量變大若超過免費額度，再考慮升級付費方案（每月約幾百元台幣起）。

如果不想自己操作這些步驟，也可以請熟悉技術的朋友或請 Claude 協助完成部署。
