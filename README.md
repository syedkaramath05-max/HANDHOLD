# HANDHOLD — Pocket Money Manager

A beginner-friendly personal finance tracker built with HTML, CSS, JavaScript and Supabase.

## Features in Version 1
- Email/password account creation and login
- Cloud-saved transactions
- Add actual pocket money received
- Record expenses such as lunch, snacks and travel
- Move money into savings
- Available balance and totals
- Transaction history and filters
- Savings milestones with a small original sound celebration
- Optional 4 PM browser reminder while the app is open

## 1. Install the tools
1. Install Visual Studio Code: https://code.visualstudio.com/
2. Install Google Chrome or another modern browser.
3. Create a folder called `HANDHOLD` and put all project files inside it.

No Node.js installation is required for this simple static version.

## 2. Create your Supabase cloud project
1. Visit https://supabase.com/ and create a free account.
2. Create a new project. Save the database password somewhere private.
3. In the Supabase dashboard, open SQL Editor.
4. Open this project's `supabase.sql`, copy all its contents and run it in SQL Editor.
5. Open Project Settings > API (or API Keys, depending on the dashboard).
6. Copy the Project URL and the publishable/anon public key.

Important: Never use or paste the `service_role` or secret key into browser JavaScript or GitHub.

## 3. Connect HANDHOLD to Supabase
1. Open `app.js` in VS Code.
2. At the top, replace:
   - `YOUR_SUPABASE_PROJECT_URL` with your Supabase Project URL
   - `YOUR_SUPABASE_ANON_PUBLIC_KEY` with your publishable/anon public key
3. Save the file.

The public/anon key is designed for browser use when Row Level Security is enabled. The SQL script enables RLS and limits rows to the signed-in user.

## 4. Run the website
Easy method:
1. In VS Code, open Extensions.
2. Search for **Live Server** by Ritwick Dey and install it.
3. Right-click `index.html`.
4. Choose **Open with Live Server**.

You can also use a simple local web server. Do not open the file as `file://` if authentication behaves unexpectedly.

## 5. Test it
1. Create an account using your email and a password.
2. Confirm your email if Supabase asks you to.
3. Log in.
4. Add a pocket-money transaction only after you actually receive money.
5. Add a lunch expense.
6. Move some money to savings.
7. Refresh the page and confirm the records are still there.

## Money calculation
Available balance = Total received - Total expenses - Total moved to savings.

Savings is a separate amount you have chosen not to spend. Version 1 does not connect to a bank, stocks, UPI or investment service.

## 4 PM reminder limitation
The browser reminder asks for notification permission and checks the time while HANDHOLD is open in a browser tab. It is not a guaranteed background notification if the browser is closed or the device is off. Reliable background push notifications require additional push-notification infrastructure. A separate ChatGPT reminder can also remind you.

## Privacy and GitHub
- Never commit passwords, Supabase secret/service_role keys, or personal transaction exports.
- The Supabase URL and publishable/anon key in `app.js` are public client configuration; database security comes from Row Level Security.
- Keep your Supabase project private to your account; the source code can be public.
- Anyone who creates their own Supabase project can use this code with their own credentials.

## Version 1 limitations
- No edit/delete transaction UI yet.
- No charts or CSV export yet.
- No recurring or automatic income.
- No automatic investment execution.
