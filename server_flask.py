#!/usr/bin/env python3
"""
Flask-based HTTP server for testing the static documentation site.
Usage: python server_flask.py
Then open http://localhost:8000 in your browser.
"""

from flask import Flask, send_from_directory, make_response
import os
import sys
from pathlib import Path
from werkzeug.exceptions import NotFound
import logging
from werkzeug.serving import WSGIRequestHandler

# Configuration
PORT = 8000
HOST = "localhost"

# Setup Flask app
app = Flask(__name__)
docs_dir = Path(__file__).parent

# Configure colored logging
class ColoredFormatter(logging.Formatter):
    COLORS = {
        'INFO': '\033[92m',  # Green
        'WARNING': '\033[93m',  # Yellow
        'ERROR': '\033[91m',  # Red
        'DEBUG': '\033[94m',  # Blue
    }
    RESET = '\033[0m'
    
    def format(self, record):
        log_color = self.COLORS.get(record.levelname, '')
        if record.levelname == 'INFO' and '200' in record.getMessage():
            prefix = f"\033[92m✓\033[0m"
        elif record.levelname == 'ERROR' or '404' in record.getMessage():
            prefix = f"\033[91m✗\033[0m"
        else:
            prefix = "  "
        
        record.msg = f"{prefix} {record.msg}"
        return super().format(record)

# Setup custom logging
handler = logging.StreamHandler()
handler.setFormatter(ColoredFormatter('%(message)s'))
logging.getLogger('werkzeug').handlers = [handler]
logging.getLogger('werkzeug').setLevel(logging.INFO)

# Disable Flask's default logging
app.logger.disabled = True
logging.getLogger('werkzeug').disabled = False

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_static(path):
    """Serve static files from the docs directory"""
    if path == '':
        path = 'index.html'
    
    # Security: prevent directory traversal
    safe_path = os.path.normpath(path)
    if safe_path.startswith('..'):
        return make_response("Invalid path", 403)
    
    file_path = docs_dir / safe_path
    
    # If path is a directory, try to serve index.html from it
    if file_path.is_dir():
        index_file = file_path / 'index.html'
        if index_file.exists():
            response = make_response(send_from_directory(file_path.parent, index_file.name))
        else:
            return make_response("Not Found", 404)
    elif file_path.exists():
        response = make_response(send_from_directory(file_path.parent, file_path.name))
    else:
        return make_response("Not Found", 404)
    
    # Add headers to prevent caching during development
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate'
    response.headers['Expires'] = '0'
    
    return response

@app.errorhandler(404)
def page_not_found(e):
    """Custom 404 handler"""
    return make_response("404 - Page not found", 404)

def main():
    print(f"\033[94m{'='*60}\033[0m")
    print(f"\033[94mManipAsInSim Documentation Server (Flask)\033[0m")
    print(f"\033[94m{'='*60}\033[0m")
    print(f"\n📁 Serving from: {docs_dir}")
    print(f"🌐 Server URL: http://{HOST}:{PORT}")
    print(f"\n\033[93mPress Ctrl+C to stop the server\033[0m")
    print(f"\033[94m{'='*60}\033[0m\n")
    
    try:
        # Use Flask's built-in development server
        app.run(
            host=HOST,
            port=PORT,
            debug=False,  # Set to True for auto-reload
            use_reloader=False
        )
    except KeyboardInterrupt:
        print(f"\n\n\033[93mServer stopped.\033[0m")
        sys.exit(0)
    except OSError as e:
        if e.errno == 48:  # Port already in use
            print(f"\033[91mError: Port {PORT} is already in use.\033[0m")
            print(f"Try one of these options:")
            print(f"  1. Kill the process using port {PORT}")
            print(f"  2. Change the PORT variable in this script")
            sys.exit(1)
        else:
            raise

if __name__ == "__main__":
    main()