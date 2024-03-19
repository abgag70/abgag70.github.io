from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from starlette.responses import HTMLResponse, FileResponse
import os

app = FastAPI()

# Serve static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Function to serve HTML files
@app.get("/{file_path:path}", response_class=HTMLResponse)
async def read_html(file_path: str):
    if not file_path:
        file_path = "index"  # Default to index.html if no file path is provided
    file_path = file_path.rstrip("/")  # Remove trailing slash if present
    html_file_path = f"templates/{file_path}.html"
    if os.path.isfile(html_file_path):
        return FileResponse(html_file_path)
    else:
        raise HTTPException(status_code=404, detail="Not found")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=80)
