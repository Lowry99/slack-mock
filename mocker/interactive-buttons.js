'use strict'

const interactiveButtons = module.exports
const request = require('request')
const nock = require('nock')
const qs = require('qs')
const logger = require('../lib/logger')
let commandNumber = 0

nock('https://slack-mock/message-action')
  .post(/.*/, () => true)
  .reply(reply)

interactiveButtons.calls = []

interactiveButtons.send = function (target, data) {
  data.response_url = `https://slack-mock/interactive-buttons/${++commandNumber}`

  // interactive-buttons use content-type application/x-www-form-urlencoded
  request({
    uri: target,
    method: 'POST',
    form: data
  }, (err, res, body) => {
    if (err) {
      return logger.error(`error receiving response to interactive button ${target}`, err)
    }

    if (typeof body === 'string') {
      try {
        body = JSON.parse(body)
      } catch (e) {
        logger.error('could not parse interactive response as json', e)
      }
    }

    interactiveButtons.calls.push({
      url: target,
      body: body,
      headers: res.headers,
      statusCode: res.statusCode,
      type: 'response'
    })
  })

  return Promise.resolve()
}

interactiveButtons.reset = function () {
  interactiveButtons.calls.splice(0, interactiveButtons.calls.length)
}

function reply (uri, requestBody) {
  if (typeof requestBody === 'string') {
    requestBody = qs.parse(requestBody)
  }

  interactiveButtons.calls.push({
    url: `https://slack-mock/interactive-buttons${uri}`,
    body: requestBody,
    headers: this.req.headers,
    type: 'response_url'
  })

  return [
    200,
    'OK'
  ]
}
