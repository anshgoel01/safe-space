# -*- coding: utf-8 -*-
"""
Safe Space - A Cross-Platform Multimodal Stress Detector with Auto-Detection

This script launches a Gradio web interface for stress detection using
voice, facial expressions, physiological data (from an ESP32), and a
DASS-21 survey. It has been modified to be platform-independent and
to include automatic serial port detection for the ESP32.

========================================================================
🚀 SETUP INSTRUCTIONS (for Windows, macOS, and Linux)
========================================================================

1.  **Install Python:**
    Ensure you have Python 3.9 or newer installed on your system.

2.  **Install FFmpeg:**
    The Whisper model for audio transcription requires FFmpeg.
    -   **Windows:** Install via a package manager like Chocolatey (`choco install ffmpeg`)
        or download from https://ffmpeg.org/download.html and add it to your system's PATH.
    -   **macOS:** Install via Homebrew: `brew install ffmpeg`
    -   **Linux (Debian/Ubuntu):** `sudo apt update && sudo apt install ffmpeg`

3.  **Install Python Libraries:**
    Save the `requirements.txt` content into a file in the same directory
    and run: `pip install -r requirements.txt`

4.  **ESP32 Setup for Auto-Detection (IMPORTANT):**
    For the "Auto-Detect" feature to work, your ESP32's Arduino code must
    be programmed to listen for the string "PING\\n" and immediately respond
    by printing "PONG\\n" to its serial output.
    
    Example ESP32 `loop()` function snippet:
    ```cpp
    void loop() {
      if (Serial.available() > 0) {
        String incoming = Serial.readStringUntil('\\n');
        if (incoming == "PING") {
          Serial.println("PONG");
        }
      }
      // ... your other sensor reading and printing code ...
    }
    ```

5.  **Run the Application:**
    Navigate to the script's directory in your terminal and run:
    `python your_script_name.py`

"""

# === Imports ===
import serial
import serial.tools.list_ports
import gradio as gr
import cv2
import numpy as np
import tensorflow as tf
import pickle
import joblib
import librosa
from datetime import datetime
import requests
import re
import whisper
from gtts import gTTS
import tempfile
import json
from pathlib import Path
import time

# === Configuration & Cross-Platform Path Setup ===
BASE_DIR = Path(__file__).parent.resolve()
MODELS_DIR = BASE_DIR / "saved_models"
STATIC_DIR = BASE_DIR / "static"
OLLAMA_API_URL = "http://localhost:11434"
OLLAMA_MODEL_NAME = "phi3:mini"

# === Global State ===
sensor_log = {}
latest_line = ""
bt_serial = None # Will be initialized by the Gradio interface

# === Helper Functions for Serial Communication ===
def list_serial_ports():
    """Lists available serial ports on the system. Cross-platform."""
    ports = serial.tools.list_ports.comports()
    return [port.device for port in ports]

def auto_detect_esp32_port():
    """
    Scans all available serial ports and performs a handshake to find the ESP32.
    Sends "PING" and expects "PONG" in response.
    """
    ports = list_serial_ports()
    if not ports:
        return "No serial ports found.", None

    for port in ports:
        yield f"Testing port: {port}...", None
        try:
            ser = serial.Serial(port, 115200, timeout=1, write_timeout=1)
            time.sleep(2) 
            ser.write(b'PING\n')
            response = ser.readline().decode('utf-8').strip()
            ser.close()

            if response == "PONG":
                yield f"✅ ESP32 found on {port}!", port
                return
        except (serial.SerialException, Exception) as e:
            yield f"Error on {port}. Skipping.", None
            continue
            
    yield "❌ Auto-detection failed. Please select the port manually.", None


def connect_to_port(port_name):
    """Connects to the selected serial port."""
    global bt_serial
    if bt_serial and bt_serial.is_open:
        bt_serial.close()

    if not port_name:
        bt_serial = None
        return "[Info] Port disconnected. 🚫"

    try:
        bt_serial = serial.Serial(port_name, 115200, timeout=2)
        return f"[✓] Connected to {port_name} successfully!"
    except serial.SerialException as e:
        bt_serial = None
        return f"[X] ERROR: Could not open {port_name}. Is the device available? Error: {e}"


# === Model Loading Functions ===
def load_models():
    """Loads all Keras models."""
    print(f"Loading models from: {MODELS_DIR}...")
    try:
        facial_model = tf.keras.models.load_model(MODELS_DIR / "facial_model.h5")
        audio_model = tf.keras.models.load_model(MODELS_DIR / "audio_model.h5")
        dass21_model = tf.keras.models.load_model(MODELS_DIR / "dass211_model.h5")
        physio_model = tf.keras.models.load_model(MODELS_DIR / "physio_model.h5")
        print("[✓] All Keras models loaded successfully.")
        return facial_model, audio_model, dass21_model, physio_model
    except Exception as e:
        print(f"[X] ERROR: Could not load one or more Keras models. Check paths/integrity. Error: {e}")
        return None, None, None, None

def load_scalers():
    """Loads all scaler objects."""
    try:
        with open(MODELS_DIR / "dass211_scaler.pkl", "rb") as f:
            dass21_scaler = pickle.load(f)
        physio_scaler = joblib.load(MODELS_DIR / 'physio_scaler.pkl')
        print("[✓] All scalers loaded successfully.")
        return dass21_scaler, physio_scaler
    except Exception as e:
        print(f"[X] ERROR: Could not load one or more scalers. Check paths/integrity. Error: {e}")
        return None, None

def load_whisper_model():
    """Loads the OpenAI Whisper model."""
    try:
        model = whisper.load_model("base")
        print("[✓] OpenAI Whisper model loaded successfully.")
        return model
    except Exception as e:
        print(f"[X] ERROR: Could not load OpenAI Whisper model. Is 'ffmpeg' installed and in PATH? Error: {e}")
        return None

# Initialize all models on startup
facial_model, audio_model, dass21_model, physio_model = load_models()
dass21_scaler, physio_scaler = load_scalers()
whisper_model = load_whisper_model()


# === Core Processing Functions ===
def scan_bt_data():
    global latest_line, sensor_log
    if bt_serial is None or not bt_serial.is_open:
        return "Bluetooth not connected. Select a port first. 🚫", sensor_log
    try:
        line = bt_serial.readline().decode('utf-8', errors='replace').strip()
        if not line:
            return "No new data received from ESP32. (Check connection/transmission) ⏳", sensor_log
        try:
            parsed_data = json.loads(line)
            timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            sensor_log[timestamp] = parsed_data
            latest_line = line
            return f"Time: {timestamp}\nData: {line} ✅", sensor_log
        except json.JSONDecodeError:
            return f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\nInvalid Data Format: {line} ⚠️", sensor_log
    except Exception as e:
        return f"Error reading from Bluetooth: {str(e)} ❌", sensor_log

def transcribe_on_audio_change(audio_file_path):
    if whisper_model is None: return "[ASR Error: Whisper model not loaded. 🚫]"
    if audio_file_path is None: return ""
    try:
        result = whisper_model.transcribe(audio_file_path)
        return result["text"]
    except Exception as e:
        return f"[ASR Error: {str(e)} ❌]"

def text_to_speech_gtts(text_to_speak, lang='en'):
    try:
        tts = gTTS(text=text_to_speak, lang=lang, tld='co.uk', slow=False)
        with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_audio_file:
            temp_path = temp_audio_file.name
        tts.save(temp_path)
        return temp_path
    except Exception as e:
        print(f"Error during TTS generation: {e}")
        return None

def predict_facial(photo_path):
    if facial_model is None: return "Error: Facial model not loaded. 🚫", 0.5
    if photo_path is None: return "Error: No facial image provided. 📸", 0.5
    try:
        img = cv2.imread(str(photo_path))
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        resized = cv2.resize(gray, (48, 48))
        input_img = (resized / 255.0).reshape(1, 48, 48, 1)
        prediction = facial_model.predict(input_img, verbose=0)
        class_id = np.argmax(prediction)
        label = "Stressed" if class_id == 1 else "Not Stressed"
        return label, float(prediction[0][class_id])
    except Exception as e:
        return f"Error processing facial image: {str(e)} 🚨", 0.5

def predict_audio(audio_file):
    if audio_model is None: return "Error: Audio model not loaded. 🚫", 0.5
    if audio_file is None: return "Error: No audio file provided. 🎙️", 0.5
    try:
        y, sr = librosa.load(audio_file, sr=22050)
        mfccs = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=38)
        target_length = 98
        if mfccs.shape[1] < target_length:
            mfccs = np.pad(mfccs, ((0, 0), (0, target_length - mfccs.shape[1])), mode='constant')
        else:
            mfccs = mfccs[:, :target_length]
        mfccs = np.expand_dims(mfccs, axis=(0, -1))
        prediction = audio_model.predict(mfccs, verbose=0)[0][0]
        label = "Stressed" if prediction >= 0.5 else "Not Stressed"
        confidence = prediction if prediction >= 0.5 else 1 - prediction
        return label, confidence
    except Exception as e:
        return f"Error processing audio: {str(e)} 🚨", 0.5

def predict_dass21(q_responses):
    if dass21_model is None or dass21_scaler is None: return "Error: DASS-21 model/scaler not loaded. 🚫", 0.5
    try:
        if not all(r is not None for r in q_responses):
            return "Error: All 21 DASS-21 questions must be answered. 📝", 0.5
        X = np.array([float(r) for r in q_responses]).reshape(1, -1)
        X_scaled = dass21_scaler.transform(X)
        pred_prob = dass21_model.predict(X_scaled, verbose=0)[0][0]
        label = "Stressed" if pred_prob >= 0.5 else "Not Stressed"
        return label, pred_prob
    except Exception as e:
        return f"Error with DASS-21 input: {str(e)} 🚨", 0.5

def predict_physio_from_line(line):
    if physio_model is None or physio_scaler is None: return "Error: Physio model/scaler not loaded. 🚫", 0.5
    if not line: return "Physio: No data available from ESP32. ⏳", 0.5
    try:
        data = json.loads(line)
        input_data = np.array([[float(data.get(k, 0)) for k in ["eda_raw", "bvp_ir_raw", "temp_c", "acc_x_raw", "acc_y_raw", "acc_z_raw"]]])
        input_scaled = physio_scaler.transform(input_data)
        prediction = physio_model.predict(input_scaled, verbose=0)[0][0]
        label = "Stressed" if prediction >= 0.5 else "Not Stressed"
        return label, (prediction if prediction >= 0.5 else 1 - prediction)
    except (json.JSONDecodeError, KeyError, ValueError) as e:
        return f"Physio: Data format error ({type(e).__name__}). ⚠️", 0.5
    except Exception as e:
        return "Physio: Prediction error. 🚨", 0.5

# === Fusion Logic and LLM Interaction ===
def get_stress_confidence(label, confidence):
    if "error" in str(label).lower(): return 0.5
    try:
        if str(label).lower() == 'stressed': return float(confidence)
        return 1.0 - float(confidence)
    except (ValueError, TypeError): return 0.5

def agreement_fusion(confidences):
    valid_confidences = [c for c in confidences if c != 0.5]
    if not valid_confidences: return 0.5
    if len(valid_confidences) == 1: return valid_confidences[0]
    M = len(valid_confidences)
    agree_scores = [sum(1 - abs(valid_confidences[i] - valid_confidences[j]) for j in range(M) if i != j) / (M - 1) for i in range(M)]
    sum_agree = sum(agree_scores)
    if sum_agree < 1e-9: return np.mean(valid_confidences)
    return float(np.sum(np.array(agree_scores) * np.array(valid_confidences)) / sum_agree)

def fused_stress_prediction(audio_file, photo_path, user_input, *dass_input):
    try:
        audio_label, audio_conf = predict_audio(audio_file)
        facial_label, facial_conf = predict_facial(photo_path)
        physio_label, physio_conf = predict_physio_from_line(latest_line)
        survey_label, survey_conf = predict_dass21(dass_input)
        
        confidences = [get_stress_confidence(l, c) for l, c in [(audio_label, audio_conf), (facial_label, facial_conf), (physio_label, physio_conf), (survey_label, survey_conf)]]
        fused_score = agreement_fusion(confidences)
        overall_label = "Stressed" if fused_score >= 0.5 else "Not Stressed"
        
        result_text = (f"## ✨ Your Stress Report from Safe Space ✨\n\n"
                       f"### 📊 Overall Stress Assessment\n"
                       f"- **Confidence of being Stressed:** `{fused_score:.2f}` (0.0 to 1.0)\n"
                       f"- **Overall Assessment:** **`{overall_label}`**\n\n")

        llm_response = "The AI coach is currently unavailable. 🤖😴"
        if OLLAMA_API_URL:
            try:
                prompt = f"""[INSTRUCTION] You are "Safe Space", a compassionate AI mental health coach. Analyze the user's data: - Stress Score: {int(fused_score * 100)}% - User's Words: "{user_input if user_input else 'Not provided.'}" Based on this, classify their stress (No Stress, Eustress, Mild/Moderate/Severe Distress) and provide 3-5 short, empathetic, and actionable tips in under 300 words. Be warm and supportive. Respond only with the analysis. [/INSTRUCTION]"""
                payload = {"model": OLLAMA_MODEL_NAME, "messages": [{"role": "user", "content": prompt}], "stream": False}
                response = requests.post(f"{OLLAMA_API_URL}/api/chat", json=payload, timeout=180)
                response.raise_for_status()
                llm_response = response.json().get('message', {}).get('content', 'No response content. 😞')
            except Exception as e:
                llm_response = f"Could not reach the AI coach. Please ensure Ollama is running.\nError: {e}"

        result_text += f"**💬 Your AI Coach, Safe Space, says:**\n{llm_response}"
        audio_output = text_to_speech_gtts(llm_response)
        return result_text, audio_output
    except Exception as e:
        return f"## ⚠️ An Application Error Occurred\n\nError: {str(e)} 💥", None

# === Gradio Interface Definition ===
def create_gradio_interface():
    dass21_questions = [ "I found it hard to wind down", "I was aware of dryness of my mouth", "I couldn’t seem to experience any positive feeling at all", "I experienced breathing difficulty", "I found it difficult to work up the initiative to do things", "I tended to over-react to situations", "I experienced trembling", "I felt I was using a lot of nervous energy", "I was worried about situations in which I might panic", "I felt that I had nothing to look forward to", "I found myself getting agitated", "I found it difficult to relax", "I felt down-hearted and blue", "I was intolerant of anything that kept me from getting on", "I felt I was close to panic", "I was unable to become enthusiastic about anything", "I felt I wasn’t worth much as a person", "I felt that I was rather touchy", "I was aware of the action of my heart in the absence of physical exertion", "I felt scared without any good reason", "I felt that life was meaningless" ]
    logo_path, mic_icon, face_icon, heart_icon, survey_icon, brain_icon = [str(STATIC_DIR / f) for f in ["safe_space_logo.png", "microphone_icon.png", "face_icon.png", "heartbeat_icon.png", "survey_icon.png", "ai_brain_icon.png"]]

    custom_css = """
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
    body { font-family: 'Poppins', sans-serif; }
    #safe-space-logo { display: block; margin-left: auto; margin-right: auto; animation: fadeInScale 1.5s ease-out forwards; border-radius: 15px; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); transition: transform 0.3s ease-in-out; }
    #safe-space-logo:hover { transform: scale(1.03); }
    @keyframes fadeInScale { from { opacity: 0; transform: scale(0.8); } to { opacity: 1; transform: scale(1); } }
    h1, h2, h3 { color: var(--primary-500); text-align: center; margin-top: 20px; margin-bottom: 15px; }
    #prediction-output { background-color: var(--color-background-primary); border-radius: 12px; padding: 25px; margin-top: 30px; border: 1px solid var(--border-color-primary); box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3); animation: slideInUp 0.8s ease-out; }
    @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    """

    with gr.Blocks(title="Safe Space", theme=gr.themes.Soft(), css=custom_css) as demo:
        with gr.Row():
            with gr.Column(scale=1): pass
            with gr.Column(scale=2):
                gr.Image(value=logo_path, width=250, show_label=False, container=False, elem_id="safe-space-logo")
            with gr.Column(scale=1): pass
        
        gr.Markdown("# ✨ Welcome to Safe Space ✨")
        gr.Markdown("Your personal AI mental well-being companion. Safe Space uses advanced technology to understand your stress levels through your voice, facial expressions, physiological data, and a quick survey. Based on this, our compassionate AI coach provides personalized insights and suggestions, speaking directly to you in a friendly voice. 💬")

        with gr.Tabs():
            with gr.TabItem("🚀 Get Your Stress Report"):
                with gr.Accordion("🔌 Step 1: Connect to ESP32 (Optional)", open=True):
                    with gr.Row():
                        detect_btn = gr.Button("🤖 Auto-Detect ESP32")
                        port_selector = gr.Dropdown(choices=list_serial_ports(), label="Or Select Port Manually")
                    detection_status = gr.Textbox(label="Detection Status", interactive=False)
                    connection_status = gr.Textbox(label="Connection Status", interactive=False)

                gr.Markdown("### 👉 Step 2: Provide Your Inputs")
                with gr.Row():
                    audio_input = gr.Audio(type="filepath", label="🎤 Record or Upload Audio")
                    image_input = gr.Image(type="filepath", label="📸 Capture or Upload Photo", image_mode="L")
                transcribed_audio_output = gr.Textbox(label="📝 Your Spoken/Typed Feelings", lines=4)
                
                with gr.Accordion("📋 DASS-21 Questionnaire (Optional)", open=False):
                    dass_inputs = [gr.Slider(0, 3, step=1, label=f"Q{i+1}: {q}", value=0) for i, q in enumerate(dass21_questions)]

                with gr.Accordion("🔗 Scan Physiological Data (Optional)", open=False):
                    scan_btn = gr.Button("📡 Scan ESP32 Data Now")
                    scan_output = gr.Textbox(label="📊 Latest Data Received", interactive=False)
                    log_output = gr.JSON(label="🗃️ Full Sensor Data Log")

                gr.Markdown("### 🌟 Step 3: Get Your Personalized Report!")
                predict_btn = gr.Button("✨ Get My Report ✨", variant="primary")
                prediction_output = gr.Markdown(label="🌟 Your Report", elem_id="prediction-output")
                llm_audio_output = gr.Audio(label="🔊 AI Coach Speaking", autoplay=True, interactive=False)

                # Event Handlers
                detect_btn.click(fn=auto_detect_esp32_port, outputs=[detection_status, port_selector])
                port_selector.change(fn=connect_to_port, inputs=port_selector, outputs=connection_status)
                audio_input.change(fn=transcribe_on_audio_change, inputs=audio_input, outputs=transcribed_audio_output)
                scan_btn.click(fn=scan_bt_data, outputs=[scan_output, log_output])
                predict_btn.click(fn=fused_stress_prediction, inputs=[audio_input, image_input, transcribed_audio_output] + dass_inputs, outputs=[prediction_output, llm_audio_output])

            with gr.TabItem("❓ How It Works"):
                gr.Markdown("## 🧠 The Science Behind Safe Space\n\nSafe Space is built on the principle of **multimodal stress assessment**, combining various data sources to provide a more comprehensive and accurate understanding of your well-being. Here's how each component contributes:\n\n")
                with gr.Row():
                    gr.Column(gr.Image(value=mic_icon, width=60, show_label=False, container=False), scale=0)
                    gr.Column(gr.Markdown("### Voice Analysis: The Sound of Emotion 🗣️\nChanges in voice pitch, tone, tempo, and other acoustic features can reveal underlying emotional states, including stress, anxiety, or calmness. Our model analyzes these subtle vocal cues to infer your emotional state."), scale=1)
                with gr.Row():
                    gr.Column(gr.Image(value=face_icon, width=60, show_label=False, container=False), scale=0)
                    gr.Column(gr.Markdown("### Facial Expression Recognition: A Window to Feelings 📸\nFacial expressions are a powerful non-verbal communication channel. Our system identifies common micro-expressions and facial action units associated with stress, tension, and various emotional states."), scale=1)
                with gr.Row():
                    gr.Column(gr.Image(value=heart_icon, width=60, show_label=False, container=False), scale=0)
                    gr.Column(gr.Markdown("### Physiological Data: The Body's Story (from ESP32) ❤️‍🩹\nYour body provides crucial biological signals related to stress. When connected, our system integrates data from an ESP32 device:\n- **EDA (Electrodermal Activity):** Measures changes in skin conductance due to sweat gland activity.\n- **BVP (Blood Volume Pulse):** Analyzes changes in blood flow, providing insights into heart rate and heart rate variability (HRV).\n- **Temperature & Accelerometer:** Skin temperature and movement can also correlate with stress levels."), scale=1)
                with gr.Row():
                    gr.Column(gr.Image(value=survey_icon, width=60, show_label=False, container=False), scale=0)
                    gr.Column(gr.Markdown("### DASS-21 Questionnaire: Self-Reported Well-being 📝\nThe Depression, Anxiety, and Stress Scales (DASS-21) is a widely recognized self-report questionnaire. Your responses provide a subjective yet clinically validated measure of your recent experiences."), scale=1)
                with gr.Row():
                    gr.Column(gr.Image(value=brain_icon, width=60, show_label=False, container=False), scale=0)
                    gr.Column(gr.Markdown("### AI Coach (Ollama's Phi-3 Mini): Your Personalized Guide 🤖\nAt the heart of Safe Space is a sophisticated Large Language Model (LLM). It processes the fused stress score and your written feelings to provide personalized, empathetic advice and then speaks its insights to you."), scale=1)
                gr.Markdown("\n**Safe Space is designed as a supportive well-being tool, not a medical diagnostic device. If you are experiencing severe distress or mental health concerns, please consult a qualified healthcare professional. 👨‍⚕️**\n\n---\n## 🧑‍💻 Project Team\nThis project, **Safe Space**, was proudly developed by **Group 4** as part of our studies in Multimodal Signal Processing and AI Applications. ❤️")

    return demo

if __name__ == "__main__":
    app = create_gradio_interface()
    app.launch(inbrowser=True, share=False)

