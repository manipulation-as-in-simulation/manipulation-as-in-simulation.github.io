#!/usr/bin/env python3
"""
Simple HTTP server for testing the static documentation site.
Usage: python server.py
Then open http://localhost:8000 in your browser.
"""

import http.server
import socketserver
import os
import sys
from pathlib import Path

# Configuration
PORT = 8000
HOST = "localhost"

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add headers to prevent caching during development
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def log_message(self, format, *args):
        # Custom log format with colors
        message = format % args
        if "GET" in message and "200" in message:
            print(f"\033[92m✓\033[0m {message}")
        elif "404" in message:
            print(f"\033[91m✗\033[0m {message}")
        else:
            print(f"  {message}")

def main():
    # Change to docs directory
    docs_dir = Path(__file__).parent
    os.chdir(docs_dir)
    
    print(f"\033[94m{'='*60}\033[0m")
    print(f"\033[94mManipAsInSim Documentation Server\033[0m")
    print(f"\033[94m{'='*60}\033[0m")
    print(f"\n📁 Serving from: {docs_dir}")
    print(f"🌐 Server URL: http://{HOST}:{PORT}")
    print(f"\n\033[93mPress Ctrl+C to stop the server\033[0m")
    print(f"\033[94m{'='*60}\033[0m\n")
    
    try:
        with socketserver.TCPServer((HOST, PORT), MyHTTPRequestHandler) as httpd:
            httpd.serve_forever()
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