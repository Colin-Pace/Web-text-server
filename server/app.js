const express = require( 'express' );

const morgan = require( 'morgan' );

const knex = require( 'knex' );

const cors = require( 'cors' );

const assert = require( 'assert' );

const { DATABASE_URL } = require('./config');



let app = express();

const knexInstance = knex ( {

  client: 'pg',

  connection: DATABASE_URL

} )



const morganSetting = process.env.NODE_ENV === 'production' ? 'tiny' : 'common';

app.use( morgan( morganSetting ) );

app.use( cors() );

app.use( express.json() );



app.use((error, req, res, next) => {

  let response

  if (process.env.NODE_ENV === 'production') {

    response = { error: { message: 'server error' }}

  } else {

    response = { error }

  }

  res.status(500).json(response)

})



app.post( '/login', (req, res) => {

  let userName = req.body.userName;

  let password = req.body.password;

  const authToken = req.body.authToken;

  assert (userName !== null && password !== null && authToken !== null)

  knexInstance

  .select( 'user_name', 'user_pw', 'user_id' )

  .from( 'users' )

  .where( { 'user_name': userName, 'user_pw': password } )

  .then( result => {

    if (result.length === 0) {

      res.send(400);

      return;
    }

    let userId = result[0].user_id;

    knexInstance

    .select( 'users' )

    .from( 'sessions' )

    .where( { 'users': userId } )

    .then( result => {

      if (result[0] === undefined) {

        knexInstance ('sessions')

          .returning('users')

          .insert( { auth_token: authToken, users: userId } )

          .then( result => {

            if ( result[0] === undefined ) {

              res.sendStatus(400);

            } else {

              res.sendStatus(200);

            }

          })

      } else {

        knexInstance('sessions')

        .returning('users')

        .where('users', '=', userId)

        .update({ auth_token: authToken })

        .then( result => {

          if ( result[0] === undefined ) {

            res.sendStatus(400);

          } else {

            res.sendStatus(200);

          }
        })
      }
    })
  })
})





app.post( '/registration', (req, res) => {

  const userName = req.body.userName;

  const password = req.body.password;

  assert (userName !== null && password !== null)

  let message = undefined;

  let REGEX_UPPER_LOWER_NUMBER_SPECIAL = /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&])[\S]+/;


  if (userName.length < 8) {

    message = 'Password must be longer than 8 characters';

  }

  if (userName.length > 72) {

    message = 'Password must be less than 72 characters';

  }

  if (userName.startsWith(' ') || password.endsWith(' ')) {

    message = 'Password must not start or end with empty spaces';

  }

  if (password.length < 8) {

    message = 'Password must be longer than 8 characters';

  }

  if (password.length > 72) {
    message = 'Password must be less than 72 characters';

  }

  if (password.startsWith(' ') || password.endsWith(' ')) {

    message = 'Password must not start or end with empty spaces';

  }

  if (!REGEX_UPPER_LOWER_NUMBER_SPECIAL.test(password)) {

    message = 'Password must contain one upper case, lower case, number and special character';

  }


  knexInstance( 'users' )

    .select( 'user_name', 'user_id' )

    .where( 'user_name', userName )

    .then( result => {

      let inDatabase = result[0];

      if (inDatabase === undefined) {

        knexInstance( 'users' )

          .returning( 'user_name' )

          .insert( { user_name: userName, user_pw: password } )

          .then( result => {

            if (result[0] === undefined) {

              res.sendStatus(500);

            } else {

              res.sendStatus(200);

            }

          } )

      } else {

        res.sendStatus(400);

      }
    })
})





app.get( '/tableTopReady', (req, res) => {

  let authToken = req.header('Authorization');

  knexInstance

    .select( '*' )

    .from( 'folders' )

    .innerJoin( 'sessions', 'folders.users', 'sessions.users' )

    .leftJoin( 'notes', 'folders.folder_id', 'notes.folders' )

    .where( { 'sessions.auth_token': authToken } )

    .then( result => {

      let data = [];

      let folderIds = [];

      for ( let itr = 0; itr < result.length; itr++ ) {

        if ( folderIds.includes( result[itr][ 'folder_id' ] ) ) {

          for ( let itrTwo = 0; itrTwo < data.length; itrTwo++ ) {

            if ( data[itrTwo][ 'folderID' ] === result[itr][ 'folder_id' ] ) {

              let noteToAdd = {};

              noteToAdd[ 'noteID' ] = result[itr][ 'note_id' ];

              noteToAdd[ 'noteName' ] = result[itr][ 'note_name' ];

              noteToAdd[ 'noteText' ] = result[itr][ 'note_text' ];

              data[itrTwo][ 'notes' ].push(noteToAdd);

            }

          }

        } else {

          folderIds.push( result[itr][ 'folder_id' ] )

          let object = {};

          object[ 'folderID' ] = result[itr][ 'folder_id' ];

          object[ 'folderName' ] = result[itr][ 'folder_name' ];

          object[ 'notes' ] = [];

          let noteToAdd = {};

          noteToAdd[ 'noteID'] = result[itr][ 'note_id' ];

          noteToAdd[ 'noteName' ] = result[itr][ 'note_name' ];

          noteToAdd[ 'noteText' ] = result[itr][ 'note_text' ];

          noteToAdd[ 'noteFolder' ] = result[itr][ 'folder_name' ];

          object[ 'notes' ].push(noteToAdd);

          data.push(object);

        }

      }

    res.send(data);

  })
})





app.post( '/createFolder', (req, res) => {

  let folderName = req.body.folderName;

  let authToken = req.header('Authorization');

  assert (folderName !== null)

  knexInstance( 'sessions' )

    .select( 'users' )

    .where( { 'sessions.auth_token': authToken } )

    .then( result => {

      let user_id = result[0].users;

      knexInstance( 'folders' )

        .insert( { folder_name: folderName, users: user_id } )

        .then( result => {

          let data = {

            folderCreated: true,

          };

          res.send(data);

        })

    })

})





app.patch( '/editFolder/:folderID', (req, res) => {

  const newFolderName = req.body.newFolderName;

  const folderID = req.body.folderID;

  assert (newFolderName !== null && folderID !== null)


  knexInstance( 'folders' )

    .where( 'folder_id', folderID )

    .update( { folder_name: newFolderName } )

    .then( result => {

      let data = {

        folderEdited: true,

      };

      res.send(data);

    })
})





app.all( '/deleteFolder/', (req, res) => {

  let folderID = req.body.folderID;

  knexInstance( 'folders' )

    .where( 'folder_id', folderID )

    .del()

    .then( result => {

      let data = {

        folderDeleted: true

      };

      res.send(data);

    })
})





app.post( '/createNote', (req, res) => {

  const folderID = req.body.folderID;

  const noteName = req.body.noteName;

  const noteText = req.body.noteText;

  assert (folderID !== null || noteName !== null || noteText !== null)


  knexInstance( 'folders' )

    .select( 'folder_id' )

    .where( 'folder_id', folderID )

    .then( result => {

      let folderColumnNumber = result[0][ 'folder_id' ];

      knexInstance( 'notes' )

        .insert(

          {

            note_name: noteName,

            note_text: noteText,

            folders: folderColumnNumber

          }

        )

        .then( result => {

          let data = {

            noteCreated: true,

          };

          res.send(data);

        })
    })
})





app.get( '/viewNote/:noteName', (req, res) => {

  let noteName = req.params.noteName;

  knexInstance

    .select( 'note_text' )

    .from( 'notes' )

    .where( 'note_name', noteName )

    .then( result => {

      res.send(result);

    })
})





app.patch( '/editNote', (req, res) => {

  const noteId = req.body.noteID;

  const noteText = req.body.noteText;

  assert (noteId !== null && noteText !== null)


  knexInstance( 'notes' )

    .where( { 'note_id': noteId } )

    .update( { note_text: noteText } )

    .then( result => {

      let data = {

        noteEdited: true,

      };

      res.send(data);

    })
})


app.patch( '/editNoteName', (req, res) => {

  const noteId = req.body.noteID;

  const noteName = req.body.noteName;

  assert (noteId !== null && noteName !== null)


  knexInstance( 'notes' )

    .where( { 'note_id': noteId } )

    .update( { note_name: noteName } )

    .then( result => {

      let data = {

        noteNameEdited: true,

      };

      res.send(data);

    })
})





app.all( '/deleteNote', (req, res) => {

  let noteID = req.body.noteID;

  knexInstance( 'notes' )

    .where( { 'note_id': noteID } )

    .del()

    .then( result => {

      let success = result === 1;

      let data = {

        noteDeleted: success

      };

      res.send(data);

    })
})





app.all( '/deleteAccount', (req, res) => {

  const userName = req.body.userName;

  const password = req.body.password;

  knexInstance( 'users' )

    .where( {'user_name': userName, 'user_pw': password } )

    .del()

    .then( result => {

      console.log(result);

      if (result === 0) {

        res.sendStatus(400);

        return;
      }

      let data = {

        accountDeleted: true

      };

      res.send(data);

    })
})


module.exports = app;
