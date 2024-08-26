from flask import Flask, jsonify, request, g, current_app, render_template, redirect
from flask_cors import CORS

from io import StringIO
from functools import wraps

app = Flask(__name__)
CORS(app)

def parse_user_list(userlist):
  users = {}
  for records in userlist.split(';'):
    try:
      name, password = records.split(':', 2)
      users[name] = password
    except:
      pass
  return users

def requires_login(fn):
  @wraps(fn)
  def wrapped_view(**kwargs):
    if request.authorization is None or getattr(g, '_authorized_user', None) is None:
      return ('Unauthorized', 401, {
        'WWW-Authenticate': 'Basic realm="Login Required"'
      })
    return fn(**kwargs)

  return wrapped_view

@app.before_request
def handle_authentication():
  if request.authorization is not None:
    auth = request.authorization
    users = current_app.config['USERS']
    if users is None:
      return
    if auth.parameters['username'] in users and \
      users[auth.parameters['username']] == auth.parameters['password']:

      g._authorized_user = auth.parameters['username']
    else:
      return

@app.route("/api/status")
def status():
  return jsonify({'message': 'OK'})

@app.route("/api/")
@requires_login
def admin_force_return():
  return jsonify({})

@app.route("/api/audience/simulate_takeaways", methods=["POST"])
def simulate_takeaways():
  return jsonify({
    'results': []
  })

@app.route("/api/audience/simulate_reactions", methods=["POST"])
def simulate_reactions():
  return jsonify({
    'results': []
  })

@app.route("/")
def host_main_page():
  return jsonify({'message': 'Endpoint does not exist'}, code = 404)

if __name__ == "__main__":
  from os import environ, path
  from dotenv import load_dotenv

  basedir = path.abspath(path.dirname(__file__))
  load_dotenv(path.join(basedir, '.env'))

  with app.app_context():
    DATABASE_URI = environ.get('DATABASE', DEFAULT_DB_LOCATION)
    PORT = int(environ.get('PORT', 5000))
    REMOTE_TASK_PAGE = environ.get('REMOTE_TASK_PAGE', f'http://127.0.0.1:{PORT}')
    USERS = parse_user_list(environ.get('ADMINISTRATORS'))

    app.config.update(
      DATABASE_URI = DATABASE_URI,
      USERS = USERS,
      REMOTE_TASK_PAGE = REMOTE_TASK_PAGE
    )

    app.run(port = PORT)
