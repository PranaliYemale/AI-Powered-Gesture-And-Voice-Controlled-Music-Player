from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from backend.models import db, User, Song
#from backend.voice_control import start_voice, stop_voice
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import os

load_dotenv()

# ---------------- APP ----------------
app = Flask(__name__)
database_url = os.getenv("DATABASE_URL")

if not database_url:
    raise ValueError("DATABASE_URL not set")

if database_url.startswith("postgres://"):
    database_url = database_url.replace("postgres://", "postgresql://", 1)

app.config["SQLALCHEMY_DATABASE_URI"] = database_url
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

db.init_app(app)

with app.app_context():
    db.create_all()

CORS(app)

@app.route("/")
def home():
    return "Backend is running 🚀"

# ---------------- MUSIC ----------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MUSIC_FOLDER = os.path.join(BASE_DIR, "music")
os.makedirs(MUSIC_FOLDER, exist_ok=True)

local_songs = [
    f for f in os.listdir(MUSIC_FOLDER)
    if f.endswith(".mp3") or f.endswith(".wav")
]

# ---------------- PLAYER ----------------
class DummyPlayer:
    def __init__(self, songs=None):
        self.songs = songs or []
        self.current_index = 0
        self.volume = 50
        self.status = "stopped"

    def play(self):
        self.status = "playing"

    def pause(self):
        self.status = "paused"

    def next_song(self):
        if self.songs:
            self.current_index = (self.current_index + 1) % len(self.songs)

    def prev_song(self):
        if self.songs:
            self.current_index = (self.current_index - 1) % len(self.songs)

    def volume_up(self):
        self.volume = min(100, self.volume + 10)

    def volume_down(self):
        self.volume = max(0, self.volume - 10)

player = DummyPlayer([])

# ---------------- LIKE / DISLIKE ----------------
likes = {}
dislikes = {}

def current_song():
    if player.songs:
        return player.songs[player.current_index]
    return None

# ---------------- STATE ----------------
voice_status = {"active": False}
gesture_status = {"active": False}

# ---------------- PLAYER CONTROLS ----------------
@app.route("/api/play", methods=["POST"])
def play():
    player.play()
    return jsonify({"status": player.status})

@app.route("/api/pause", methods=["POST"])
def pause():
    player.pause()
    return jsonify({"status": player.status})

@app.route("/api/next", methods=["POST"])
def next_song():
    player.next_song()
    return jsonify({"current_index": player.current_index})

@app.route("/api/prev", methods=["POST"])
def prev_song():
    player.prev_song()
    return jsonify({"current_index": player.current_index})

@app.route("/api/volume_up", methods=["POST"])
def volume_up():
    player.volume_up()
    return jsonify({"volume": player.volume})

@app.route("/api/volume_down", methods=["POST"])
def volume_down():
    player.volume_down()
    return jsonify({"volume": player.volume})

# ---------------- LIKE / DISLIKE APIs ----------------
@app.route("/api/like", methods=["POST"])
def like_song():
    song = current_song()
    if not song:
        return jsonify({"error": "No song playing"}), 400

    likes[song] = likes.get(song, 0) + 1
    return jsonify({"song": song, "likes": likes[song]})

@app.route("/api/dislike", methods=["POST"])
def dislike_song():
    song = current_song()
    if not song:
        return jsonify({"error": "No song playing"}), 400

    dislikes[song] = dislikes.get(song, 0) + 1
    return jsonify({"song": song, "dislikes": dislikes[song]})

# ---------------- STATE ROUTE ----------------
@app.route("/api/state")
def get_state():
    song = current_song()
    return jsonify({
        "mode": "local",
        "status": player.status,
        "current_index": player.current_index,
        "voice": voice_status["active"],
        "gesture": gesture_status["active"],
        "song": song,
        "likes": likes.get(song, 0),
        "dislikes": dislikes.get(song, 0)
    })

# ---------------- SONG LIST ----------------
@app.route("/music/<filename>")
def serve_music(filename):
    return send_from_directory(MUSIC_FOLDER, filename)


@app.route("/api/songs")
def get_songs():
    songs = []
    if os.path.exists(MUSIC_FOLDER):
        songs = [
            f for f in os.listdir(MUSIC_FOLDER)
            if f.endswith(".mp3") or f.endswith(".wav")
        ]

    player.songs = songs   # ⭐ IMPORTANT

    return jsonify({"songs": songs})

@app.route("/api/play_index", methods=["POST"])
def play_index():
    data = request.get_json()
    index = data.get("index", 0)

    songs = [
        f for f in os.listdir(MUSIC_FOLDER)
        if f.endswith(".mp3") or f.endswith(".wav")
    ]

    player.songs = songs

    if index < 0 or index >= len(player.songs):
        return jsonify({"error": "Invalid index"}), 400

    player.current_index = index
    player.play()

    return jsonify({
        "status": player.status,
        "current_index": player.current_index
    })

# ---------------- AUTH ----------------
@app.route("/api/signup", methods=["POST"])
def signup():
    data = request.get_json()

    if User.query.filter(
        (User.email == data["email"]) |
        (User.username == data["username"])
    ).first():
        return jsonify({"error": "User already exists"}), 400

    hashed_password = generate_password_hash(data["password"])
    user = User(
        username=data["username"],
        email=data["email"],
        password=hashed_password
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({"message": "Signup successful"}), 201

@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json()

    user = User.query.filter(
        (User.email == data["email_or_username"]) |
        (User.username == data["email_or_username"])
    ).first()

    if not user:
        return jsonify({"error": "User not found"}), 401

    if not check_password_hash(user.password, data["password"]):
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify({"message": "Login successful", "user_id": user.id})

# ---------------- VOICE ----------------
"""@app.route("/api/voice/start", methods=["POST"])
def voice_start():
    start_voice()
    voice_status["active"] = True
    return jsonify({"status": "voice started", "active": True})

@app.route("/api/voice/stop", methods=["POST"])
def voice_stop():
    stop_voice()
    voice_status["active"] = False
    return jsonify({"status": "voice stopped", "active": False})

@app.route("/api/voice_status")
def voice_status_route():
    return jsonify(voice_status)"""

# ---------------- GESTURE ----------------
@app.route("/api/gesture/start", methods=["POST"])
def gesture_start():
    gesture_status["active"] = True
    return jsonify({"status": "gesture started", "active": True})

@app.route("/api/gesture/stop", methods=["POST"])
def gesture_stop():
    gesture_status["active"] = False
    return jsonify({"status": "gesture stopped", "active": False})

@app.route("/api/gesture_status")
def gesture_status_route():
    return jsonify(gesture_status)

# ---------------- RUN ----------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)