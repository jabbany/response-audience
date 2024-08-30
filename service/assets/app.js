'use strict';

(function (_) {

  function $(e) {
    return document.getElementById(e);
  }

  function _makeThrobber() {
    return _('div', {
      'className': 'throbber'
    }, [
      _('div', {'className': 'dot'}),
      _('div', {'className': 'dot'}),
      _('div', {'className': 'dot'})
    ]);
  }

  window.addEventListener('load', function () {
    $('form-simulate-takeaways').addEventListener('submit', function (e) {
      e.preventDefault();
      var content = $('f-takeaways-content').value;
      var personas = $('f-takeaways-personas').value;

      $('output').innerHTML = '';
      $('output').appendChild(_makeThrobber());

      fetch('/api/audience/key_points', {'method': 'post', 'body': JSON.stringify({
        'content': content,
        'personas': personas.trim().split('\n').map(function (p) {
          return JSON.parse(p);
        })}),
        'headers': {
          'content-type': 'application/json',
          'accept':'application/json'
        }}).then(function (resp) {
          return resp.json();
        }).then(function (results) {
          $('output').innerHTML = '';

          $('output').appendChild(_('h3', {}, [_('','Key Concerns of Target Audience')]))
          $('output').appendChild(_('ul', {}, results['key_points']['points'].map(function (point) {
            return _('li', {}, [_('', point)])
          })));

          $('output').appendChild(_('h3', {}, [_('','Simulated Personas')]))
          results['takeaways'].forEach(function (persona) {
            $('output').appendChild(_('div', {'className': 'card'}, [
              _('div', {'className': 'card-body'}, [ _('', persona['takeaway'])]),
              _('div', {'className': 'card-body'}, [ _('', JSON.stringify(persona['profile']))])
            ]))
          })
        }).catch(function (e) {
          alert('Error occurred! \n' + e);
        });
    });

    $('form-simulate-source-rankings').addEventListener('submit', function (e) {
      e.preventDefault();

      var sources = $('f-source-sources').value;
      var personas = $('f-source-personas').value;

      $('output').innerHTML = '';
      $('output').appendChild(_makeThrobber());

      fetch('/api/audience/rank_sources', {'method': 'post', 'body': JSON.stringify({
        'sources': sources.trim().split('\n').map(function (p) {
          return JSON.parse(p);
        }),
        'personas': personas.trim().split('\n').map(function (p) {
          return JSON.parse(p);
        })}),
        'headers': {
          'content-type': 'application/json',
          'accept':'application/json'
        }}).then(function (resp) {
          return resp.json();
        }).then(function (results) {
          $('output').innerHTML = '';

          $('output').appendChild(_('h3', {}, [_('','Re-Ranked Sources')]))
          results['sources'].forEach(function (source) {
            $('output').appendChild(_('div', {'className': 'card'}, [
              _('div', {'className': 'card-body'}, [ _('', JSON.stringify(source['source']))]),
              _('div', {'className': 'card-body'}, [ _('', source['ratings'].map(function (rating) {
                return rating.rating + ' (p=' + rating.persona_id + ')';
              }).join(', ')) ])
            ]))
          })
        }).catch(function (e) {
          alert('Error occurred! \n' + e);
        });
    });

    $('form-synthesize-output').addEventListener('submit', function (e) {
      e.preventDefault();

      var content = $('f-synthesis-content').value;
      var sources = $('f-synthesis-sources').value;
      var keypoints = $('f-synthesis-keypoints').value;

      $('output').innerHTML = '';
      $('output').appendChild(_makeThrobber());

      fetch('/api/response/generate', {'method': 'post', 'body': JSON.stringify({
        'content': content.trim(),
        'sources': sources.trim().split('\n').map(function (p) {
          return JSON.parse(p);
        }),
        'key_points': keypoints.trim().split('\n').map(function (p) {
          return p.trim();
        })}),
        'headers': {
          'content-type': 'application/json',
          'accept':'application/json'
        }}).then(function (resp) {
          return resp.json();
        }).then(function (results) {
          $('output').innerHTML = '';

          $('output').appendChild(_('blockquote', {}, [_('',results['response'])]));
        }).catch(function (e) {
          alert('Error occurred! \n' + e);
        });
    });

    $('form-simulate-reactions').addEventListener('submit', function (e) {
      e.preventDefault();

      var content = $('f-reactions-content').value;
      var response = $('f-reactions-response').value;
      var personas = $('f-reactions-personas').value;
      var keypoints = $('f-reactions-keypoints').value;

      $('output').innerHTML = '';
      $('output').appendChild(_makeThrobber());

      fetch('/api/audience/simulate_reactions', {'method': 'post', 'body': JSON.stringify({
        'content': content,
        'personas': personas.trim().split('\n').map(function (p) {
          return JSON.parse(p);
        }),
        'key_points': keypoints.trim().split('\n').map(function (p) {
          return p.trim();
        }),
        'response': response}),
        'headers': {
          'content-type': 'application/json',
          'accept':'application/json'
        }}).then(function (resp) {
          return resp.json();
        }).then(function (results) {
          $('output').innerHTML = '';

          $('output').appendChild(_('h3', {}, [_('','Evaluation of Key Points')]))
          $('output').appendChild(_('ul', {}, results['evaluation'].map(function (point) {
            return _('li', {}, [_('', point['concern'] + ': ' + point['evaluation'])])
          })));

          $('output').appendChild(_('h3', {}, [_('','Simulated Personas')]))
          results['reactions'].forEach(function (persona) {
            $('output').appendChild(_('div', {'className': 'card'}, [
              _('div', {'className': 'card-body'}, [ _('', persona['reaction'])]),
              _('div', {'className': 'card-body'}, [ _('', JSON.stringify(persona['profile']))])
            ]))
          })
        }).catch(function (e) {
          alert('Error occurred! \n' + e);
        });
    });
  });
})(dfc);
