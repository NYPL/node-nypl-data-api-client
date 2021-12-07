#!/usr/bin/env node

const fs = require('fs')
const prompt = require('prompt')
const jsdiff = require('diff')
const avsc = require('avsc')
require('colors')

const argv = require('minimist')(process.argv.slice(2), {
  default: {
    envfile: '.env'
  }
})

const DataApiClient = require('../')
require('dotenv').config({ path: argv.envfile })

const log_level = argv.log_level || 'error'

var client = new DataApiClient({ log_level })

var doPost = function (path, content) {
  if ((typeof content) !== 'object') {
    content = JSON.parse(content)
  }

  client.post(path, content)
    .then((resp) => {
      console.log(`Done POSTing to ${path}`)
      console.log(`Response: ${JSON.stringify(resp, null, 2)}`)
    }).catch((e) => {
      console.error('Error: ', e)
    })
}

var doPatch = function (path, content) {
  if ((typeof content) !== 'object') {
    content = JSON.parse(content)
  }

  client.patch(path, content)
    .then((resp) => {
      console.log(`Done PATCHing ${path}`)
      console.log(`Response: ${JSON.stringify(resp, null, 2)}`)
    }).catch((e) => {
      console.error('Error: ', e)
    })
}

var doGet = function (path) {
  if (!path) throw new Error('Path required')

  client.get(path)
    .then((resp) => {
      let formattedResponse = resp
      if (typeof resp !== 'string') {
        // If JSON, format as json, otherwise print as-is:
        try { Object.keys(resp).length >= 1 && (formattedResponse = JSON.stringify(resp, null, 2)) } catch (e) { }
      }
      console.log('Got response: \n', formattedResponse)
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

function promptTo (method, path, content, cb) {
  if (argv.content) {
    content = fs.readFileSync(argv.content, 'utf8')
  }
  if (!content) throw new Error(`${method}ing requires content to ${method}`)

  try {
    // Assume all posted/patched bodies are json
    content = JSON.parse(content)
  } catch (e) {
    throw new Error(`Content to ${method} does not appear to be JSON. Only JSON supported currently.`)
  }

  console.log(`${method}ing`)
  console.log(`  To endpoint: ${process.env.NYPL_API_BASE_URL}${path}:`)
  console.log(`  Using credentials: ${process.env.NYPL_OAUTH_KEY}@${process.env.NYPL_OAUTH_URL}`)
  console.log(`${JSON.stringify(content, null, 2)}`)
  console.log('Proceed?')
  prompt.start()
  prompt.get('y/n', (e, result) => {
    if (result['y/n'] === 'y') cb(path, content)
    else console.log('Aborting.')
  })
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
    const path = `schemas/${name}`
    console.log(`Really upload to ${process.env.NYPL_API_BASE_URL}${path} ?`)
    prompt.start()
    prompt.get('y/n', (e, result) => {
      if (result['y/n'] === 'y') doPost(path, next)
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
    description: 'Specialized commands for interacting with schemas',
    subcommands: {
      post: {
        description: 'Post a version of a schema. Will prepare request and confirm before proceeding.',
        usage: 'nypl-data-api schema post [name] [jsonfilepath]',
        examples: [ 'nypl-data-api schema post Bib ./new-bib-schema.json' ],
        exec: schemaPost
      }
    }
  },
  post: {
    description: 'Post JSON to an arbitrary endpoint. Will prepare request and confirm before proceeding.',
    usage: 'nypl-data-api post [path] [inlinejson]',
    examples: [ 'nypl-data-api post recap/checkin-requests \'{ "foo": "bar" }\'' ],
    exec: (argv.y ? doPost : (path, content) => promptTo('POST', path, content, doPost))
  },
  patch: {
    description: 'Patch JSON to an arbitrary endpoint. Will prepare request and confirm before proceeding.',
    usage: 'nypl-data-api patch [path] [inlinejson]',
    examples: [ 'nypl-data-api patch hold-requests \'{ "success": false }\'' ],
    exec: (argv.y ? doPatch : (path, content) => promptTo('PATCH', path, content, doPatch))
  },
  get: {
    description: 'Get arbitrary endpoint.',
    usage: 'nypl-data-api get [path]',
    examples: [ 'nypl-data-api schema get bibs' ],
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
      let subCommands = Object.keys(commandHash[command].subcommands)
      console.log('Available subcommands: \n  ' + subCommands.join('\n  '))
    }
  } else {
    let commands = Object.keys(commandHash)
    console.log('Available commands: \n  ' + commands.join('\n  '))
  }

  if (commandSpec) {
    console.log('Showing help for `' + command + (subcommand ? ' ' + subcommand : '') + '`')
    console.log(`Description: ${commandSpec.description}`)
    console.log(`Usage: ${commandSpec.usage}`)
    if (commandSpec.examples) {
      console.log('Examples:')
      commandSpec.examples.forEach((example) => {
        console.log(` $ ${example}`)
      })
    }
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
    // Establish args to be passed to command:
    let args = argv._.slice(1)

    // Establish which command group we'll be executing:
    let commandGroup = commandHash[command]

    // If subcommand selected, use that:
    if (subcommand && commandGroup.subcommands && commandGroup.subcommands[subcommand]) {
      commandGroup = commandGroup.subcommands[subcommand]
      args = argv._.slice(1)
    }

    // Execute the command
    const exec = commandGroup.exec
    if (exec) exec.apply(null, args)
    else help(command)
  } catch (e) {
    console.log('Error thrown: ', e)

    // Show relevant help:
    help(command, subcommand)
  }
}
