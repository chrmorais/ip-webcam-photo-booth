import argparse
import datetime
import os.path
import urlparse
import warnings

from flask import Flask, redirect, render_template, send_file
import requests

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/preview')
def preview():
    return redirect(urlparse.urljoin(app.config['IP_CAMERA_URL'], 'video'))

@app.route('/photo')
def photo():
    photo_filename = os.path.join(app.config['PHOTO_PATH'], '{}.jpg'.format(
        datetime.datetime.now().strftime('%Y-%m-%dT%H.%M.%S')
    ))
    photo_path = os.path.dirname(photo_filename)

    try:
        os.makedirs(photo_path)
    except OSError:
        if not os.path.isdir(photo_path):
            raise

    response = requests.get(urlparse.urljoin(app.config['IP_CAMERA_URL'], 'photo.jpg'))
    with open(photo_filename, 'wb') as fp:
        fp.write(response.content)

    return send_file(photo_filename)
