from flask import Flask, json, send_file

import tensorflow as tf
import tensorflow_hub as hub
import pandas as pd
import numpy as np
import requests
import os
import time
import json
from sklearn.decomposition import PCA

IMAGE_HEIGHT = 321
IMAGE_WIDTH = 321

model = hub.KerasLayer('https://tfhub.dev/google/on_device_vision/classifier/landmarks_classifier_europe_V1/1',output_key='predictions:logits')
xls = pd.read_csv("resources\landmarks_classifier_europe_V1_label_map(2).csv")
dict_labels = dict(zip(xls.id,xls.name))
directory = "resources\\0\\"
out_vec = []


#ładowanie obrazka
def load_img(path):
    img = tf.io.read_file(path)
    img = tf.image.decode_jpeg(img, channels=3)
    img = tf.image.resize(img, [IMAGE_HEIGHT, IMAGE_WIDTH])
    img = tf.keras.preprocessing.image.img_to_array(img) / 255.0
    img = tf.expand_dims(img, 0)
    return img

#przepuszczenie przez sieć i zwrócenie nazwy
def name_img(img):
    output_tensor = model(img)
    index = np.argmax(output_tensor)
    return dict_labels[index]

#przepuszczenie przez api i wyciągnięcie koordynatów
def loc_img(name):
    query = name.replace(' ', '+')
    response = requests.get('http://nominatim.openstreetmap.org/search?q=' + query + '&format=json')
    time.sleep(2)
    print("waiting two seconds due to api load")
    result = response.json()
    if not result:
        print("coordinates not found:" + name)
        return[0,0]
    return [result[0]["lat"], result[0]["lon"]]


#przetwarzanie 
def load_n(num):
    print("workload: " + str(num) + " elements")
    for filename in os.listdir(directory):
        print(str(num) + " elements left")
        image = load_img(directory+filename)
        name = name_img(image)
        loc = loc_img(name)
        out_vec.append({'filename': filename, 'place': name, 'lat': loc[0], 'lon': loc[1]})
        num-=1
        if num == 0:
            break
    
#print(output_tensor.shape)
#print(np.argmax(output_tensor))

load_n(10)
res = json.dumps(out_vec)
for jsn in out_vec:
    print(jsn)

app = Flask(__name__)

#hostowanie analizowanej listy
#(jest liczona niezależnie od zapytań ze względu na wolne api)
@app.route("/list")
def get_data():
    response = app.response_class(response=res,status=200,mimetype='application/json')
    return response

#hostowanie analizowanej listy
@app.route("/get_img/<path:path>")
def get_img(path):
    filename = directory + path
    return send_file(filename, mimetype='image/gif')
