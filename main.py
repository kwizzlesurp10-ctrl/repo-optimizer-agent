from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sqlite3
from typing import Optional, List
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="HyperAgent Repo Forge Sentinel")

# SQLite setup
DB_FILE = "actions.db"

def init_db():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute('''CREATE TABLE IF NOT EXISTS actions
                 (id INTEGER PRIMARY KEY, timestamp TEXT, repo TEXT, action TEXT, status TEXT)''')
    conn.commit()
    conn.close()

init_db()

class OptimizeRequest(BaseModel):
    owner: str
    repo: str
    target_branch: str = "main"
    dry_run: bool = True

@app.post("/optimize")
async def optimize_repo(request: OptimizeRequest):
    # This is where we would call github___push_files or other connected tools
    # For now, log the action
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("INSERT INTO actions (timestamp, repo, action, status) VALUES (datetime('now'), ?, ?, ?)",
              (f"{request.owner}/{request.repo}", "optimize", "dry_run" if request.dry_run else "live"))
    conn.commit()
    conn.close()
    
    return {
        "status": "success",
        "message": "Optimization initiated",
        "dry_run": request.dry_run,
        "note": "GitHub connector tools will be called here in full implementation"
    }

@app.get("/status")
async def get_status():
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()
    c.execute("SELECT * FROM actions ORDER BY timestamp DESC LIMIT 10")
    actions = c.fetchall()
    conn.close()
    return {"recent_actions": actions}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
