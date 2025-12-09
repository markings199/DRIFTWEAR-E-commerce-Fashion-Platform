============================================
🚀 DRIFTWEAR E-COMMERCE WEBSITE - SETUP GUIDE
============================================

📋 PREREQUISITES:
-----------------
• Node.js installed on your computer
• Stable internet connection (for MongoDB Atlas)
• Code editor (VS Code recommended)

🛠️ INSTALLATION STEPS:
----------------------

1. 📂 EXTRACT PROJECT FOLDER
   • Make sure all files are in "EcomProjectName_MidtermOutput2025" folder

2. 🔧 INSTALL DEPENDENCIES (First Time Only)
   • Open Terminal/Command Prompt
   
   For Backend:
   cd backend
   npm install
   
   For Frontend:
   cd frontend  
   npm install

3. 🚀 RUN THE APPLICATION
   ----------------------
   
   STEP 1: START BACKEND SERVER
   • Open Terminal/Command Prompt
   • Navigate to backend folder:
     cd backend
   • Run the server:
     node server.js
   
   ✅ EXPECTED OUTPUT:
   ==================================================
   🚀 Driftwear E-commerce Backend Server
   ==================================================
   📡 Server running on port 5000
   ✅ Server started successfully!
   ✅ MongoDB connected: ac-g0vaoxn-shard-00-01.cxpunba.mongodb.net
   ==================================================
   
   STEP 2: START FRONTEND CLIENT
   • Open NEW Terminal/Command Prompt (keep backend running)
   • Navigate to frontend folder:
     cd frontend
   • Start development server:
     npm run dev
   
   ✅ EXPECTED OUTPUT:
   VITE v4.5.14 ready in 345 ms
   ➜ Local:   http://localhost:5173/
   ➜ Network: use --host to expose

4. 🌐 ACCESS THE WEBSITE
   • Open your web browser
   • Go to: http://localhost:5173
   • The website should load with full functionality

📊 PORTS IN USE:
----------------
• Frontend Application: http://localhost:5173
• Backend API Server:  http://localhost:5000
• API Health Check:    http://localhost:5000/api/health

⚠️ TROUBLESHOOTING:
------------------
❌ Backend won't start?
   • Check if port 5000 is available
   • Verify MongoDB connection in backend/.env file

❌ Frontend won't start?  
   • Make sure backend is running first
   • Check if port 5173 is available
   • Run "npm install" in frontend folder

❌ Website shows errors?
   • Ensure both backend and frontend are running
   • Check browser console for specific errors

🎯 FEATURES AVAILABLE:
---------------------
✅ User Registration & Login
✅ Product Catalog & Search
✅ Shopping Cart Management
✅ Order Processing
✅ Responsive Design

📞 SUPPORT:
----------
If you encounter any issues:
1. Check that both servers are running
2. Verify all environment files are in place
3. Ensure MongoDB connection is active

============================================
✅ SETUP COMPLETE - Happy Online Shopping! 🛍️
============================================