# MerchantMate 🏪
### Aapki dukaan, aapka hisaab

A simple mobile-first web app for small Indian merchants to manage 
udhaar (credit), stock, and daily sales — all in one place. 
No training needed. Works in Hindi, Hinglish, or English.

---

## The Problem

Kailash Pandit runs a kirana store in Munger, Bihar.
Like most small merchants in Bharat, his entire business runs on:
- A paper diary for udhaar (credit)
- Memory for stock levels
- WhatsApp and phone calls for reminders and reorders

This leads to:
- Lost udhaar that never gets collected
- Stockouts on fast-moving items like Maggi, bread, doodh
- No visibility into daily sales or profit

---

## The Solution

MerchantMate replaces the pen-paper diary with a simple app that 
a 55-year-old merchant can use without any training.

---

## Features

### 📒 Udhaar (Credit Management)
- Add customers with phone number and outstanding amount
- Track what items each customer took on credit
- See total outstanding at a glance
- WhatsApp reminder — opens pre-filled message directly on customer's number
- Per-entry Mark Paid button
- Full udhaar history per customer
- Days since last payment shown on each customer card

### 📦 Stock & Reorder
- Add items with quantity, unit, purchase price, selling price
- Set minimum stock level — auto marks LOW when quantity falls below
- Reorder List tab — all low stock items in one place
- Send full reorder list to supplier via WhatsApp in one tap
- Reorder history per item

### 📊 Statistics
- Total udhaar outstanding
- Udhaar given vs cleared — weekly bar graph
- Monthly trend line graph
- Top 5 pending customers
- Risk list — customers not paid in 30+ days
- Daily sales summary — cash + UPI
- Estimated profit based on purchase vs selling price
- Total stock value

### 👤 Profile & Settings
- One-time shop setup — name, owner, city, phone
- Language toggle — Pure Hindi / Hinglish / Pure English
- Light / Dark mode
- All data saved in localStorage — persists between sessions

---

## Tech Stack

- React
- Lovable (AI-powered frontend builder)
- localStorage (no backend — works offline)
- wa.me WhatsApp API for reminders

---

## Live App

👉 https://merchantmate.lovable.app

---

## Built For

OkCredit Future Founders Internship 2026
Team: MerchantMate
Institution: IIT Kanpur
Merchant: Kailash Pandit, Panditji Kirana and General Store, Munger, Bihar

---

## How to Run Locally

```bash
git clone https://github.com/your-handle/merchantmate
cd merchantmate
npm install
npm run dev
```

---

## Week 4 Status
- [x] Home screen with stats and illustration
- [x] Udhaar management with WhatsApp reminders
- [x] Stock tracking with low stock alerts
- [x] Reorder list with WhatsApp supplier message
- [x] Statistics with graphs
- [x] Language switching (Hindi / Hinglish / English)
- [x] Dark / Light mode
- [x] Deployed live on merchantmate.lovable.app
