const { expect } = require('chai');

const supertest = require('supertest');

const app = require('../server/app.js');

/*
Required manual testing
1. Registration
2. Delete folder
3. Create note
4. View note
5. Edit note
6. Edit note name
7. Delete note
8. Delete account
*/

describe('Express App', () => {
  it('should return a message from POST /login', () => {

    return supertest(app)

      .post( '/login' )

      .send( { userName: "Colin Pace", password: "colinpace123!", authToken: "Q29saW4gUGFjZTpjb2xpbnBhY2UxMjMh" } )

      .expect( 200 )
  });


  it('should return a message from POST /registration', () => {

    return supertest(app)

      .post( '/registration' )

      .send( { userName: "New User", password: "newPassword123!" } )

      .expect( 200 )
  });


  it('should return a message from GET /tableTopReady', () => {

    return supertest(app)

      .get( '/tableTopReady' )

      .set( { Authorization: "Q29saW4gUGFjZTpjb2xpbnBhY2UxMjMh" } )

      .then( res => {

        expect( res.body ).to.be.an( 'array' );
      });
  });


  it('should return a message from POST /createFolder', () => {

    return supertest(app)

      .post( '/createFolder' )

      .set( { Authorization: "Q29saW4gUGFjZTpjb2xpbnBhY2UxMjMh" } )

      .send( { folderName: "New Folder" } )

      .then( res => {

        expect( res.body ).to.be.an( 'object' );
      });
  });


  it('should return a message from PATCH /editFolder', () => {

    return supertest(app)

      .patch( '/editFolder/:folderID' )

      .send( { folderID: 21, newFolderName: "Edited folder" } )

      .then( res => {

        expect( res.body ).to.be.an( 'object' );
      });
  });


  it('should return a message from ALL /deleteFolder', () => {

    return supertest(app)

      .delete( '/deleteFolder' )

      .send( { folderID: 18 } )

      .then( res => {

        expect( res.body ).to.be.an( 'object' );
      });
  });


  it('should return a message from POST /createNote', () => {

    return supertest(app)

      .post( '/createNote' )

      .send( { folderID: 15, noteName: "New Note", noteText: "This is a thoughtful note." } )

      .then( res => {

        expect( res.body ).to.be.an( 'object' );
      });
  });


  it('should return a message from GET /viewNote', () => {

    return supertest(app)

      .post( '/viewNote/:noteName' )

      .send( { noteName: "New Note" } )

      .then( res => {

        expect( res.body ).to.be.an( 'object' );
      });
  });


  it('should return a message from PATCH /editNote', () => {

    return supertest(app)

      .patch( '/editNote' )

      .send( { noteID: 2, noteText: "Edited note" } )

      .then( res => {

        expect( res.body ).to.be.an( 'object' );
      });
  });


  it('should return a message from PATCH /editNoteName', () => {

    return supertest(app)

      .patch( '/editNoteName' )

      .send( { noteID: 2, noteName: "Edited note name" } )

      .then( res => {

        expect( res.body ).to.be.an( 'object' );
      });
  });


  it('should return a message from ALL /deleteNote', () => {

    return supertest(app)

      .delete( '/deleteNote' )

      .send( { noteID: 4 } )

      .then( res => {

        expect( res.body ).to.be.an( 'object' );
      });
  });


  it('should return a message from ALL /deleteAccount', () => {

    return supertest(app)

      .delete( '/deleteAccount' )

      .send( { userName: "New User", password: "newPassword123!" } )

      .then( res => {

        expect( res.body ).to.be.an( 'object' );
      });
  });
});
