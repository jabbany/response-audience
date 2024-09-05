from flask import Flask, jsonify, request, g, current_app, render_template, redirect, send_from_directory
from flask_cors import CORS

from io import StringIO
from functools import wraps

import re
import random
import numpy as np

from openai import OpenAI
MODEL = 'gpt-4o'

app = Flask(__name__)
CORS(app)

def parse_user_list(userlist):
  users = {}
  if userlist is None:
    return users
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

#########################################################################
@app.route("/api/status")
def status():
  return jsonify({'message': 'OK'})

SUPPORTED_TRAITS = {
  'name': [None],
  'age': range(18, 80),
  'gender': ['man', 'woman', 'non-binary', None],
  'political': ['republican', 'democrat', 'independent'],
  'ethnicity': ['white', 'black', 'asian', 'mixed-race', None],
  'education': ['high school degree', 'college or undergraduate degree', 'graduate degree', 'doctorate degree', None],
  'religion': ['very important', 'somewhat important', 'not at all important'],
  'location': ['an urban', 'a rural', None],
  'household_size': ['1', '2', '3', '4', '5', '6', 'more than 6'],
  'home_ownership': ['homeowner', 'renter', None],
  'employment': ['employed', 'unemployed', 'retired', None]
}

def create_persona(constrain_traits, use_traits = list(SUPPORTED_TRAITS.keys()), rng = random.Random(0)):
  persona_items = []
  persona_profile = {}
  for trait in use_traits:
    if trait in constrain_traits:
      trait_value = constrain_traits[trait]
    else:
      # Draw a random trait
      trait_value = rng.choice(SUPPORTED_TRAITS[trait])

    persona_profile[trait] = trait_value

    if trait_value is None:
      # Skip this trait.
      continue;

    if trait == 'name':
      persona_items.append(f'Your name is {trait_value}.')
    elif trait == 'age':
      persona_items.append(f'You are {trait_value} years old.')
    elif trait == 'gender':
      persona_items.append(f'You identify as a {trait_value}.')
    elif trait == 'political':
      persona_items.append(f'Politically, you identify as {trait_value}.')
    elif trait == 'ethnicity':
      persona_items.append(f'Ethincally, you are {trait_value}.')
    elif trait == 'education':
      persona_items.append(f'Your highest level of education is a {trait_value}.')
    elif trait == 'religion':
      persona_items.append(f'You consider religion to be {trait_value} in your daily life.')
    elif trait == 'location':
      persona_items.append(f'You live in {trait_value} area.')
    elif trait == 'household_size':
      persona_items.append(f'Your household has {trait_value} member(s).')
    elif trait == 'home_ownership':
      persona_items.append(f'You are a {trait_value}.')
    elif trait == 'employement':
      persona_items.append(f'You are currenty {trait_value}.')

  return persona_profile, ' '.join(persona_items)


@app.route("/api/audience/generate", methods = ["POST"])
def sample_audience():
  inputs = request.get_json()
  if inputs is None:
    return jsonify({'message': 'Did not provide input json.'}, code = 400)

  simulated_personas = inputs['personas']
  if len(simulated_personas) < 1:
    return jsonify({'message': 'You must specify at least one persona profile to simulate.'}, code = 400)

  client = OpenAI(api_key = current_app.config['OPENAI_API_KEY'])

  personas = []
  for persona in simulated_personas:
    persona_profile, persona_text = create_persona(persona)
    # LLM
    try:
      chat = client.chat.completions.create(
        model = MODEL,
        messages = [
          {'role': 'system', 'content': persona_text},
          {'role': 'user', 'content': f'What is your name? Please respond with just your first and last name. You may make one up.'}
        ])

      named_persona = { k:v for k, v in persona_profile.items() }
      named_persona['name'] = chat.choices[0].message.content
      personas.append(named_persona)
    except Exception as e:
      print(e)
  return jsonify({
    'personas': personas
  })

@app.route("/api/audience/key_points", methods=["POST"])
def key_points():
  inputs = request.get_json()
  if inputs is None:
    return jsonify({'message': 'Did not provide input json.'}, code = 400)

  # Read the prompts
  with open('prompts/extract-key-points.txt', 'r') as f:
    keypoints_prompt = f.read()

  # Extract the needed parameters
  content = inputs['content']
  simulated_personas = inputs['personas']

  if len(simulated_personas) < 1:
    return jsonify({'message': 'You must specify at least one persona profile to simulate.'}, code = 400)

  client = OpenAI(api_key = current_app.config['OPENAI_API_KEY'])

  # Step 1: Generate the takeaways
  takeaways = []
  for persona in simulated_personas:
    persona_profile, persona_text = create_persona(persona)
    # LLM
    try:
      chat = client.chat.completions.create(
        model = MODEL,
        messages = [
          {'role': 'system', 'content': persona_text},
          {'role': 'user', 'content': f'You see the following post on social media: \n\n{content}.\n\nAfter reading this post, what is your reaction? Be terse when answering.'}
        ])
      takeaways.append({
        'profile': persona_profile,
        'takeaway': chat.choices[0].message.content
      })
    except Exception as e:
      print(e)

  # Step 2: Summarize
  key_points, raw_key_points = [], ''
  try:
    chat = client.chat.completions.create(
      model = MODEL,
      messages = [
        {'role': 'system', 'content': keypoints_prompt},
        {'role': 'user', 'content': '\n\n'.join([item['takeaway'] for item in takeaways])}
      ])
    raw_key_points = chat.choices[0].message.content
    for point in re.split(r'\n', raw_key_points):
      key_points.append(re.sub(r'^(-|\d+\.)\s+', '', point).strip())
  except Exception as e:
    print(e)

  return jsonify({
    'takeaways': takeaways,
    'key_points': {
      'points': key_points,
      'raw': raw_key_points
    }
  })

@app.route("/api/audience/rank_sources", methods=["POST"])
def rank_sources():
  inputs = request.get_json()
  if inputs is None:
    return jsonify({'message': 'Did not provide input json.'}, code = 400)

  # Extract the needed parameters
  sources = inputs['sources']
  simulated_personas = inputs['personas']

  if len(simulated_personas) < 1:
    return jsonify({'message': 'You must specify at least one persona profile to simulate.'}, code = 400)

  client = OpenAI(api_key = current_app.config['OPENAI_API_KEY'])

  concrete_personas = [create_persona(persona) for persona in simulated_personas]

  # Loop through the source
  rated_list = []

  for source in sources:
    # Step 1: Generate the raw ratings
    ratings = []
    for i, (persona_profile, persona_text) in enumerate(concrete_personas):
      # LLM
      try:
        chat = client.chat.completions.create(
          model = MODEL,
          messages = [
            {'role': 'system', 'content': persona_text},
            {'role': 'user', 'content': f'You read the following quote from {source["name"]}: \n\n{source["quote"]}\n\nPublished at this URL: {source["url"]}.\n\nOn a scale from 1 to 5, considering the source, rate how trustworthy you believe this quote to be. Respond only with the rating value.'}
          ])
        raw_response = chat.choices[0].message.content
        rating_number = re.sub(r'[^\d]', '', raw_response)
        ratings.append({
          'persona_id': i,
          'raw': raw_response,
          'rating': int(rating_number) if len(rating_number) > 0 else None
        })
      except Exception as e:
        print(e)

    rated_list.append({
      'source': source,
      'ratings': ratings,
      'score': np.mean([r['rating'] for r in ratings if r['rating'] is not None])
    })

  ranked_list = sorted(rated_list, key = lambda r: r['score'], reverse = True)

  return jsonify({
    'personas': [persona_profile for persona_profile, _ in concrete_personas],
    'sources': ranked_list
  })

@app.route("/api/response/generate", methods=["POST"])
def generate_response():
  inputs = request.get_json()
  if inputs is None:
    return jsonify({'message': 'Did not provide input json.'}, code = 400)

  # Read the prompts
  with open('prompts/correction-generation.txt', 'r') as f:
    correction_prompt = f.read()

  # Extract the needed parameters
  content = inputs['content']
  sources = inputs['sources']
  key_points = inputs['key_points']

  client = OpenAI(api_key = current_app.config['OPENAI_API_KEY'])

  # Generate the concerns
  concerns = '\n'.join([f'- {point}' for point in key_points])

  output = ''
  try:
    facts = '\n'.join([f"- {source['quote']} Reference: {source['url']}" for source in sources])
    chat = client.chat.completions.create(
      model = MODEL,
      messages = [
        {'role': 'system', 'content': correction_prompt},
        {'role': 'user', 'content': f'Social media post: \n\n{content}.\n\nFacts:\n\n{facts}\n\nConcerns:\n\n{concerns}'}
      ])
    output = chat.choices[0].message.content
  except Exception as e:
    print(e)

  return jsonify({
    'response': output
  })

@app.route("/api/audience/simulate_reactions", methods=["POST"])
def simulate_reactions():
  inputs = request.get_json()
  if inputs is None:
    return jsonify({'message': 'Did not provide input json.'}, code = 400)

  # Read the prompts
  with open('prompts/evaluate-key-points.txt', 'r') as f:
    keypoints_prompt = f.read()

  # Extract the needed parameters
  content = inputs['content']
  response_text = inputs['response']
  simulated_personas = inputs['personas']
  key_points = inputs['key_points']

  if len(simulated_personas) < 1:
    return jsonify({'message': 'You must specify at least one persona profile to simulate.'}, code = 400)

  client = OpenAI(api_key = current_app.config['OPENAI_API_KEY'])

  # Step 1: Generate the takeaways
  reactions = []
  for persona in simulated_personas:
    persona_profile, persona_text = create_persona(persona)
    # LLM
    try:
      chat = client.chat.completions.create(
        model = MODEL,
        messages = [
          {'role': 'system', 'content': persona_text},
          {'role': 'user', 'content': f'You see the following post on social media: \n\n{content}\n\nFollowed by the following reply: \n\n{response_text}\n\n. After reading this thead, what is your reaction? Be terse when answering.'}
        ])
      reactions.append({
        'profile': persona_profile,
        'reaction': chat.choices[0].message.content
      })
    except Exception as e:
      print(e)

  # Step 2: Reflect on how well the key points were addressed
  reflections = []
  for point in key_points:
    try:
      chat = client.chat.completions.create(
        model = MODEL,
        messages = [
          {'role': 'system', 'content': keypoints_prompt },
          {'role': 'user', 'content': f'Social media post: {content}\n\nResponse: {response_text}\n\nConcern: {point}'}
        ])
      addressed = chat.choices[0].message.content
      reflections.append({
        'concern': point,
        'evaluation': addressed
      })
    except Exception as e:
      print(e)

  return jsonify({
    'reactions': reactions,
    'evaluation': reflections
  })

########################################################################
@app.route("/")
def host_main_page():
  # This just returns the debug UI
  return render_template("index.html")

@app.route("/assets/<path:path>")
def host_static(path):
  return send_from_directory('assets', path)

if __name__ == "__main__":
  from os import environ, path
  from dotenv import load_dotenv

  basedir = path.abspath(path.dirname(__file__))
  load_dotenv(path.join(basedir, '.env'))

  with app.app_context():
    OPENAI_API_KEY = environ.get("OPENAI_API_KEY")

    PORT = int(environ.get('PORT', 5000))
    USERS = parse_user_list(environ.get('ADMINISTRATORS'))

    app.config.update(
      USERS = USERS,
      OPENAI_API_KEY = OPENAI_API_KEY
    )

    app.run(port = PORT, debug = True)
