# Smart Focus Streaming – Frontend Dashboard

This is the **React + Vite** dashboard for the Smart Focus Streaming project.  
It lives in the monorepo under `front-dashboard/` and shows a grid of cameras with bandwidth, QoD status and a Smart Focus toggle per stream.

## Run locally (hot reload)


## Run with Docker (dev, hot reload)

From `front-dashboard/`:

```bash
docker compose up
```

Then open `http://localhost:8080/`. The container mounts your local code, so changes in `front-dashboard/src` reload automatically.




Vite will start with hot reload (see console for the port, default 5173 or 8080).


## Stack

- React
- TypeScript
- Vite
- shadcn-ui
- Tailwind CSS
