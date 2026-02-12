import os
import threading
from flask import Flask, request, jsonify, redirect, send_from_directory
from flask_cors import CORS

# ---------------- AUDIO / ALSA FIX ----------------
os.environ["SDL_AUDIODRIVER"] = "dummy"
try:
    import pygame
    pygame.init()
except Exception:
    pass  # ignore pygame init errors on server

# ---------------- BACKEND IMPORTS ----------------
from backend.models import db, User, Song
from backend.player import MusicPlayer
from backend.spotify_control import SpotifyController
from backend.voice_control import start_voice, stop_voice

# ---------------- PATHS ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "database.db")
FRONTEND_BUILD = os.path.join(BASE_DIR, "..", "frontend", "build")
MUSIC_FOLDER = os.path.join(BASE_DIR, "music")
os.makedirs(MUSIC_FOLDER, exist_ok=True)

# ---------------- FLASK APP ----------------
app = Flask(
    __name__,
    static_folder=os.path.join(FRONTEND_BUILD, "static"),
    template_folder=FRONTEND_BUILD
)
CORS(app)

# ---------------- DATABASE ----------------
app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
db.init_app(app)
with app.app_context():
    db.create_all()

# ---------------- LOCAL SONGS ----------------
local_songs = [
    os.path.join(MUSIC_FOLDER, f) for f in os.listdir(MUSIC_FOLDER)
    if f.endswith(".mp3") or f.endswith(".wav")
]

# ---------------- SPOTIFY ----------------
spotify_ctrl = SpotifyController(
    client_id="YOUR_CLIENT_ID",
    client_secret="YOUR_CLIENT_SECRET",
    redirect_uri="YOUR_REDIRECT_URI"
)

# ---------------- PLAYER ----------------
player = MusicPlayer(local_songs=local_songs, spotify_controller=spotify_ctrl)

player_state = {
    "mode": "local",
    "status": "stopped",
    "song": "",
    "volume": 50,
    "liked": None,
    "voice": False,
    "gesture": False
}

voice_status = {"active": False}

# ---------------- ROUTES ----------------
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_react(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.template_folder, "index.html")

@app.route("/songs/<path:filename>")
def serve_song(filename):
    return send_from_directory(MUSIC_FOLDER, filename)

# ---------------- SONG LIST ----------------
@app.route("/api/songs", methods=["GET"])
def get_local_songs():
    songs = [f for f in os.listdir(MUSIC_FOLDER) if f.endswith(".mp3") or f.endswith(".wav")]
    return jsonify({"songs": songs})

# ---------------- AUTH ----------------
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()
    username, email, password = data.get("username"), data.get("email"), data.get("password")

    if User.query.filter((User.email == email) | (User.username == username)).first():
        return jsonify({"error": "User already exists"}), 400

    user = User(username=username, email=email, password=password)
    db.session.add(user)
    db.session.commit()
    return jsonify({"message": "Signup successful"}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()
    email_or_username, password = data.get("email_or_username"), data.get("password")

    user = User.query.filter(
        (User.email == email_or_username) | (User.username == email_or_username)
    ).first()

    if user and user.password == password:
        return jsonify({"user_id": user.id}), 200
    return send_from_directory(app.template_folder, "index.html")

@app.route("/api/logout", methods=["POST"])
def logout():
    return jsonify({"message": "Logged out"}), 200

@app.route("/api/state", methods=["GET"])
def get_state():
    return jsonify({
        "mode": player_state["mode"],
        "status": player_state["status"],
        "current_index": getattr(player, "current_index", 0),
        "voice": voice_status.get("active", False),
        "gesture": False
    })

# ---------------- LOCAL PLAYER ----------------
@app.route("/api/play", methods=["POST"])
def play():
    player.play()
    player_state.update({"status": "playing", "mode": "local"})
    return jsonify({"message": "Playing local song"}), 200

@app.route("/api/pause", methods=["POST"])
def pause():
    player.pause()
    player_state.update({"status": "paused", "mode": "local"})
    return jsonify({"message": "Paused"}), 200

@app.route("/api/next", methods=["POST"])
def next_song():
    player.next_song()
    player_state.update({"status": "playing", "mode": "local"})
    return jsonify({"message": "Next song", "current_index": player.current_index}), 200

@app.route("/api/prev", methods=["POST"])
def prev_song():
    player.prev_song()
    player_state.update({"status": "playing", "mode": "local"})
    return jsonify({"message": "Previous song", "current_index": player.current_index}), 200

# ---------------- SPOTIFY CONTROLS ----------------
@app.route("/api/spotify/login")
def spotify_login():
    return redirect(spotify_ctrl.oauth.get_authorize_url())

@app.route("/api/spotify/callback")
def spotify_callback():
    code = request.args.get("code")
    token_info = spotify_ctrl.oauth.get_access_token(code)
    spotify_ctrl.set_token(token_info)
    return redirect("http://localhost:3000")

@app.route("/api/spotify/play", methods=["POST"])
def spotify_play():
    if not spotify_ctrl.is_ready():
        return jsonify({"error": "Spotify not logged in"}), 401
    player.play_spotify()
    player_state.update({"status": "playing", "mode": "spotify"})
    return jsonify({"message": "Spotify playing"}), 200

# ---------------- VOICE CONTROL ----------------
@app.route("/api/voice/start", methods=["POST"])
def voice_start_route():
    threading.Thread(target=start_voice, daemon=True).start()
    voice_status["active"] = True
    return {"status": "voice started"}, 200

@app.route("/api/voice/stop", methods=["POST"])
def voice_stop_route():
    stop_voice()
    voice_status["active"] = False
    return {"status": "voice stopped"}, 200

@app.route("/api/voice_status")
def get_voice_status():
    return voice_status

# ---------------- SHUTDOWN ----------------
@app.route("/shutdown", methods=["POST"])
def shutdown():
    os._exit(0)
    return "ok"

# ---------------- RUN ----------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
