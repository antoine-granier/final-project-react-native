from flask import Flask, request, send_file, session
# from flask.ext.session import Session

import os
from flask_cors import CORS
import onnxruntime as rt
import librosa
import numpy as np
import soundfile as sf

app = Flask(__name__)
app.secret_key = "super secret key"
CORS(app, expose_headers='Authorization')

model_path = "./models"


# Routine executée avant la premiere requete qui permet de lire la liste des modèles
@app.before_first_request
def init():
    models_list = os.listdir("./models")
    print(models_list)
    session["models"] = models_list
    session["currentModel"] = models_list[0]


# Réponse à une requete vide
@app.route("/")
def main():
    return "Connexion sucess ! "


# Upload un fichier et conversion de l'audio avec le modèle
@app.route("/upload", methods=['POST'])
def upload():
    try:
        print('receiving file')
        file = request.files["file"]
        extension = request.headers["Filename"].split(".")[-1]
        fpath = "./received_audio." + extension
        file.save(fpath)
        audio, sr = librosa.load(fpath, sr=44100)

        audio = np.expand_dims(audio, (0, 1))
        sess = rt.InferenceSession(os.path.join(model_path,
                                                session["currentModel"]),
                                   providers=rt.get_available_providers())
        res = sess.run([sess.get_outputs()[0].name], {"audio_in": audio})
        sf.write('transformed_audio.wav', res[0].squeeze(), 44100)
        return "Computation done - ready to download "
    except Exception as e:
        print(str(e))
        return "Error during computation " + str(e)


# Telechargement du fichier transformé par le modèle
@app.route("/download", methods=['GET'])
def download():
    print("sending file")
    path = "transformed_audio.wav"
    return send_file(path, as_attachment=True)


# Traitement de diverses requetes
@app.route("/getmodels")
def getModels():
    models = {"models": session["models"]}
    return models


# Selection du modèle à utiliser
@app.route("/selectModel/<modelName>")
def setModel(modelName):
    if modelName not in session["models"]:
        return "model not found ! "
    else:
        if modelName[-5:] != ".onnx":
            modelName += ".onnx"
        session["currentModel"] = modelName
        return f"model selected - {modelName}"


if __name__ == '__main__':
    app.run(debug=True, port=8000, host="0.0.0.0")