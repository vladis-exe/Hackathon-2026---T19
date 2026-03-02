# Smart Focus Streaming – Frontend Dashboard

This is the **React + Vite** dashboard for the Smart Focus Streaming project.  
It lives in the monorepo under `front-dashboard/` and shows a grid of cameras with bandwidth, QoD status and a Smart Focus toggle per stream.

## Run locally

From the monorepo root:

## Run with Docker

From `front-dashboard/`:

```bash
docker build -t focus-stream-dashboard .
docker run --rm -p 8080:80 focus-stream-dashboard
```

Then open `http://localhost:8080/`.


```bash
cd front-dashboard
npm install
npm run dev
```

Vite will start on `http://localhost:5173/`.


## Stack

- React
- TypeScript
- Vite
- shadcn-ui
- Tailwind CSS
