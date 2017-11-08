#!/usr/bin/env node

const fs = require('fs')
const prompt = require('prompt')
const jsdiff = require('diff')
const avsc = require('avsc')
require('colors')

const argv = require('minimist')(process.argv.slice(2))
const DataApiClient = require('../')
require('dotenv').config()

var client = new DataApiClient()

var doPost = function (path, content) {
  console.log('client.post(' + path + ', ', JSON.stringify(content) + ')')
  client.post(path, JSON.stringify(content))
    .then((resp) => {
      console.log(`Done writing ${path}`)
    }).catch((e) => {
      console.error('Error: ', e)
    })
}

var doGet = function (path) {
  console.log('get path: ', path)
  client.get(path)
    .then((resp) => {
      console.log(JSON.stringify(resp, null, 2))
    }).catch((e) => {
      console.error('Error: ', e)
    })
}

var showDiff = function (one, two) {
  one = JSON.stringify(one, null, 2)
  two = JSON.stringify(two, null, 2)
  console.log('Diff: (green additions, red removals) ')

  if (one === two) console.log('[No detected change]')

  var diff = jsdiff.diffChars(one, two)

  diff.forEach(function (part) {
    // green for additions, red for deletions
    // grey for common parts
    var color = part.added ? 'green' : part.removed ? 'red' : 'grey'
    process.stderr.write(part.value[color])
  })
  console.log()
}

function schemaPost () {
  var name = argv._[2]
  var jsonfile = argv._[3]
  if (!name) throw new Error('Missing name')
  if (!jsonfile) throw new Error('Missing jsonfile')

  console.log(`Executing ${command} ${subcommand}, posting new ${name} schema from ${jsonfile}`)

  var promptOverwrite = function (previous, next) {
    if (previous && next) {
      showDiff(previous, next)
    }
    console.log('Really upload?')
    prompt.start()
    prompt.get('y/n', (e, result) => {
      if (result['y/n'] === 'y') doPost(`schemas/${name}`, next)
      else console.log('Aborting.')
    })
  }

  var next = fs.readFileSync(jsonfile, { encoding: 'utf8' })

  // Check it for validity
  try {
    avsc.parse(next)
    console.log('Schema looks like a schema.')
  } catch (e) {
    console.log('Error parsing schema: ' + e.message)
    process.exit()
  }

  client.get(`current-schemas/${name}`).then((previous) => {
    promptOverwrite(previous.schemaObject, JSON.parse(next))
  }).catch((e) => {
    console.log('Error fetching ' + name + ' (' + JSON.stringify(e.message, null, 2) + ')')
    promptOverwrite(null, next)
  })
}

const commandHash = {
  schema: {
    post: {
      description: 'Post a version of a schema',
      usage: 'nypl-data-api schema post [name] [jsonfile]',
      exec: schemaPost
    }
  },
  get: {
    description: 'Get arbitrary endpoint',
    usage: 'nypl-data-api get [path]',
    exec: doGet
  }
}

function help (command, subcommand) {
  let commandSpec = null

  if (commandHash[command] && commandHash[command][subcommand]) {
    commandSpec = commandHash[command][subcommand]
  } else if (command && commandHash[command]) {
    if (commandHash[command].exec) commandSpec = commandHash[command]
    else {
      let subCommands = Object.keys(commandHash[command])
      console.log('Available subcommands: \n  ' + subCommands.join('\n  '))
    }
  } else {
    let commands = Object.keys(commandHash)
    console.log('Available commands: \n  ' + commands.join('\n  '))
  }

  if (commandSpec) {
    console.log('Help: ' + command + (subcommand ? ' ' + subcommand : ''))
    console.log('Description: ' + commandSpec.description)
    console.log('Usage: ' + commandSpec.usage)
  }
}

var command = argv._[0]
var subcommand = argv._[1]

if (!command) help()
else if (command === 'help') {
  var _command = argv._[1]
  var _subcommand = argv._[2]
  help(_command, _subcommand)
} else if (command) {
  try {
    let exec = commandHash[command][subcommand]
    let args = []
    if (!exec) {
      exec = commandHash[command].exec
      args = argv._.slice(1)
    }
    if (exec) exec.apply(null, args)
    else help(command)
  } catch (e) {
    console.log('Error thrown: ', e)
    help(command, subcommand)
  }
}
