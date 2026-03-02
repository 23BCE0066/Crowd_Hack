# Smart AI Crowd Monitoring System

A real-time crowd monitoring and risk analysis dashboard powered by YOLOv8 and React.

This project is separated into a local AI analyzer (Backend) and a cloud-ready dashboard (Frontend).

## 1. Deploying the Frontend (Vercel)
The beautiful dashboard is built with React/Vite and is ready for Vercel.

1. Push this code to GitHub.
2. Go to Vercel and create a new project.
3. Import your GitHub repository.
4. Set the **Framework Preset** to `Vite`.
5. Set the **Root Directory** to `crowd-hack/frontend`.
6. Add the following **Environment Variables** in Vercel:
   - `VITE_CLERK_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - *(Optional)* `VITE_BACKEND_URL` (Set this to your Ngrok/Localhost URL if you want the deployed dashboard to read your local AI feeds)
7. Click **Deploy**.

## 2. Running the AI Brain (Locally)
Because the AI needs to access your physical camera and process heavy video frames, **it must run on your local machine**, not Vercel.

1. Open a terminal in the root folder.
2. Ensure you have the requirements: `pip install -r crowd-hack/requirements.txt`
3. Run the AI Model: `python crowd-hack/app/main.py`
4. Run the API Server: `fastapi dev crowd-hack/api/server.py`

*Note: By default, the frontend looks for the backend at `http://127.0.0.1:8000`. If you deploy the frontend to Vercel and want it to see your camera, you will need to expose your local `8000` port using a service like Ngrok and set that as `VITE_BACKEND_URL` in Vercel.*
