########  imports  ##########
from flask import Flask, render_template, jsonify, request, current_app, send_from_directory, url_for
import json
import requests

app = Flask(__name__, static_url_path='', static_folder='static')
rootUrl = "https://app.ticketmaster.com/discovery/v2/"
jsonStub = ".json?"
apikey = "REDACTED"

@app.route('/')
def home_page():
    return app.send_static_file('eventSearch.html')

@app.route('/searchEvents')
def getEvents():
    
    eventStub = "events"
    
    geoPoint = request.args['geohash']
    radius = request.args['distance']
    cat = request.args['cat']
    unit = "miles"
    keyword = request.args['keyword']
    eventID = request.args['eventId']
    segmentId = ""

    if cat == "default":
        segmentId = ""
    elif cat == "music":
        segmentId = "KZFzniwnSyZfZ7v7nJ"
    elif cat ==  "sports":
        segmentId = "KZFzniwnSyZfZ7v7nE"
    elif cat ==  "arts":
        segmentId = "KZFzniwnSyZfZ7v7na"
    elif cat ==  "film":
        segmentId = "KZFzniwnSyZfZ7v7nn"
    elif cat ==  "misc":
        segmentId = "KZFzniwnSyZfZ7v7n1"
    else:
        segmentId = ""

    if eventID == "":
        url_search = rootUrl + eventStub + jsonStub + "&".join(
            [
                "geoPoint=" + geoPoint,
                "radius=" + radius,
                "unit=" + unit,
                "keyword=" + keyword,
                "segmentId=" + segmentId,
                "apikey=" + apikey
            ])
    else:
        url_search = rootUrl + eventStub + "/" + eventID + jsonStub + "apikey=" + apikey
    response = requests.get(url_search)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response = response.json() 
    return response

@app.route('/searchVenue')
def getVenue():
    venueStub = "venues/"
    venueId = request.args['venueId']

    url_search = rootUrl + venueStub + venueId + jsonStub + "apikey=" + apikey
    response = requests.get(url_search)
    response.headers['Access-Control-Allow-Origin'] = '*'
    response = response.json() 
    return response


# https://www.nylas.com/blog/use-python-requests-module-rest-apis/

if __name__ == '__main__':
    # This is used when running locally only. When deploying to Google App
    # Engine, a webserver process such as Gunicorn will serve the app. This
    # can be configured by adding an `entrypoint` to app.yaml.
    # Flask's development server will automatically serve static files in
    # the "static" directory. See:
    # http://flask.pocoo.org/docs/1.0/quickstart/#static-files. Once deployed,
    # App Engine itself will serve those files as configured in app.yaml.
    # home_page()
    app.run(host='127.0.0.1', port=8080, debug=True)