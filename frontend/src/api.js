import axios from "axios";

// Use your Render backend URL here
const API = axios.create({
  baseURL: "https://ai-powered-gesture-and-voice-controlled-ob5a.onrender.com/api",
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

export default API;