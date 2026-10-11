from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import threading
import webbrowser


PROJECT_DIR = Path(__file__).resolve().parent


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main():
    handler = partial(NoCacheHandler, directory=str(PROJECT_DIR))
    server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
    base_url = f"http://127.0.0.1:{server.server_address[1]}"
    pages = (
        f"{base_url}/index.html",
        f"{base_url}/Prototype.html",
    )

    threading.Thread(target=server.serve_forever, daemon=True).start()
    for page in pages:
        if not webbrowser.open_new_tab(page):
            print(f"Could not open a browser tab automatically: {page}")

    print("IoT Solar Lighting pages are running. Press Ctrl+C to stop the local server.")
    for page in pages:
        print(page)

    try:
        threading.Event().wait()
    except KeyboardInterrupt:
        print("\nStopping the local server.")
    finally:
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
