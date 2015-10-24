import argparse
import os.path
import sys

import requests

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from server.app import app

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('ip_camera_url')
    args = parser.parse_args()

    response = requests.get(args.ip_camera_url)
    server = response.headers.get('Server')
    if not server.startswith('IP Webcam Server'):
        warnings.warn('May not be an IP Webcam Server - identified as {!r}'.format(server))

    app.config['PHOTO_PATH'] = os.path.join(os.path.dirname(__file__), '../../photos')
    app.config['IP_CAMERA_URL'] = args.ip_camera_url
    app.run(debug=True)

if __name__ == '__main__':
    main()
