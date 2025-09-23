import { Express } from "express";
import session from "express-session";
import { storage } from "./storage";

const FASTAPI_BASE_URL = process.env.VITE_FASTAPI_URL || 'http://localhost:8000';

// Role-based authorization middleware
export function requireAuth(req: any, res: any, next: any) {
  if (!req.session.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function requireRole(requiredRole: "admin" | "technician" | "user") {
  return (req: any, res: any, next: any) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "Authentication required" });
    }
    
    const user = req.session.user;
    const roleHierarchy = { admin: 3, technician: 2, user: 1 };
    const userLevel = roleHierarchy[user.role as keyof typeof roleHierarchy] || 0;
    const requiredLevel = roleHierarchy[requiredRole];
    
    if (userLevel < requiredLevel) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    
    next();
  };
}

export function setupAuth(app: Express) {
  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // CSRF protection
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));

  app.post("/api/login", async (req: any, res: any) => {
    try {
      const { username, password } = req.body;
      
      console.log('Login attempt for username:', username);
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      console.log('Calling FastAPI login at:', `${FASTAPI_BASE_URL}/login`);
      
      // Llamar al endpoint de FastAPI
      const response = await fetch(`${FASTAPI_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          username,
          password
        })
      });

      console.log('FastAPI response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.log('FastAPI error response:', errorText);
        
        if (response.status === 401) {
          return res.status(401).json({ error: "Invalid username or password" });
        }
        throw new Error(`FastAPI login failed: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('FastAPI login successful for user:', data.username);
      
      // Guardar datos de usuario en la sesión
      req.session.user = {
        id: data.id,
        username: data.username,
        role: data.role,
        access_token: data.access_token,
        token_type: data.token_type
      };

      // Regenerar sesión para prevenir session fixation
      req.session.regenerate((err: any) => {
        if (err) {
          console.error('Session regeneration failed:', err);
          return res.status(500).json({ error: "Session error" });
        }
        
        // Volver a guardar los datos después de regenerar
        req.session.user = {
          id: data.id,
          username: data.username,
          role: data.role,
          access_token: data.access_token,
          token_type: data.token_type
        };
        
        res.json({ 
          id: data.id, 
          username: data.username, 
          role: data.role,
          access_token: data.access_token,
          token_type: data.token_type
        });
      });

    } catch (error) {
      console.error('Login error details:', error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/logout", (req: any, res: any) => {
    req.session.destroy((err: any) => {
      if (err) {
        console.error('Logout error:', err);
        return res.status(500).json({ error: "Logout failed" });
      }
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req: any, res: any) => {
    if (!req.session.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    res.json({ 
      id: req.session.user.id, 
      username: req.session.user.username, 
      role: req.session.user.role 
    });
  });
}