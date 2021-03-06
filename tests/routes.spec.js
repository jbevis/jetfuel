process.env.NODE_ENV = 'testing';

const chai = require('chai');
const should = chai.should();
const chaiHttp = require('chai-http');
const server = require('../server');
const knex = require('../db/knex.js');

chai.use(chaiHttp);

describe('Client Routes', () => {

  it('should return the homepage with html elements', (done) => {
    chai.request(server)
    .get('/')
    .end((err, response) => {
      response.should.have.status(200);
      response.should.be.html;
      done();
    });
  });

  it('should return a 404 for a route that doesn\'t exist', (done) => {
    chai.request(server)
    .get('/sad')
    .end((err, response) => {
      response.should.have.status(404);
      done();
    });
  });

});

describe('API Routes', () => {

  beforeEach(done => {
    knex.migrate.rollback()
    .then(() => {
      knex.migrate.latest()
      .then(() => {
        return knex.seed.run()
        .then(() => {
          done();
        });
      });
    });
  });

  describe('GET /api/v1/topics', () => {
    it('should return all of the topics', (done) => {
      chai.request(server)
      .get('/api/v1/topics')
      .end((err, response) => {
        const sortedBody = response.body.sort((a, b) => a.id - b.id);

        response.should.have.status(200);
        response.should.be.json;
        sortedBody[0].should.have.property('id');
        sortedBody[0].should.have.property('name');
        sortedBody[0].name.should.equal('Docs');
        sortedBody[0].id.should.equal(1);
        done();
      });
    });

    it('should return a 404 if directed to a non existent endpoint', (done) => {
      chai.request(server)
      .get('/api/v1/folders')
      .end((error, response) => {

        response.should.have.status(404)
        done()
      });
    });
  });

  describe('GET /jet.fuel/:short_link', () => {

    it('should redirect the user to the correct \'long\' link', (done) => {
      chai.request(server)
      .get('/jet.fuel/2H1PG')
      .end((err, response) => {
        response.should.have.status(200);
        response.redirects.should.be.a('array')
        response.redirects[0].should.equal('http://www.twitter.com/')
        done();
      });
    });
  });

  describe('GET /api/v1/links', () => {
    it('should return all of the links', (done) => {
      chai.request(server)
      .get('/api/v1/links')
      .end((err, response) => {
        const sortedBody = response.body.sort((a, b) => a.id - b.id);

        response.should.have.status(200);
        response.should.be.json;
        sortedBody[0].should.have.property('id');
        sortedBody[0].should.have.property('link_title');
        sortedBody[0].should.have.property('long_link');
        sortedBody[0].should.have.property('short_link');
        sortedBody[0].should.have.property('click_count');
        sortedBody[0].should.have.property('topic_id');
        sortedBody[0].id.should.equal(1);
        sortedBody[0].link_title.should.equal('the google');
        sortedBody[0].long_link.should.equal('http://www.google.com');
        sortedBody[0].short_link.should.equal('jet.fuel/5ZvQv');
        sortedBody[0].click_count.should.equal(3);
        sortedBody[0].topic_id.should.equal(1);
        done();
      });

    });
  })

  describe('GET /api/v1/topics/:topic_id/links', () => {
    it('should return all links for a given topic', done => {
      chai.request(server)
      .get('/api/v1/topics/1/links')
      .end((err, response) => {
        const sortedBody = response.body.sort((a, b) => a.id - b.id);

        response.should.have.status(200);
        response.should.be.json;
        sortedBody.length.should.equal(2);
        sortedBody[0].should.have.property('id');
        sortedBody[0].should.have.property('link_title');
        sortedBody[0].should.have.property('long_link');
        sortedBody[0].should.have.property('short_link');
        sortedBody[0].should.have.property('click_count');
        sortedBody[0].should.have.property('topic_id');
        sortedBody[0].id.should.equal(1);
        sortedBody[0].link_title.should.equal('the google');
        sortedBody[0].long_link.should.equal('http://www.google.com');
        sortedBody[0].short_link.should.equal('jet.fuel/5ZvQv');
        sortedBody[0].click_count.should.equal(3);
        sortedBody[0].topic_id.should.equal(1);
        done();
      });
    });

  });

  describe('POST /api/v1/topics', () => {
    it('should create a new topic', (done) => {
      chai.request(server)
      .post('/api/v1/topics')
      .send({
        name: 'News',
      })
      .end((err, response) => {
        response.should.have.status(201);
        response.body.should.be.a('object');
        response.body.should.have.property('id');
        response.body.id.should.equal(3);
        chai.request(server)
        .get('/api/v1/topics')
        .end((err, response) => {
          const sortedBody = response.body.sort((a, b) => a.id - b.id);

          response.should.have.status(200);
          response.should.be.json;
          sortedBody[2].should.have.property('id');
          sortedBody[2].should.have.property('name');
          sortedBody.length.should.equal(3);
          sortedBody[2].name.should.equal('News');
          sortedBody[2].id.should.equal(3);
          done();
        })
      });
    });

    it('should not create a topic record with missing data', (done) => {
      chai.request(server)
      .post('/api/v1/topics')
      .send({animal: 'unicorn'})
      .end((err, response) => {
        response.should.have.status(422);
        response.body.error.should.equal('Expected format: { name: <String>}. You are missing the name property.')
        done()
      });
    });

  });

  describe('POST /api/v1/links', () => {

    it('should add a new link', (done) => {
      const linkBody = { link_title: 'StackOverflow',
                       long_link: 'http://www.stackoverflow.com',
                       short_link: 'jet.fuel/5tU8',
                       click_count: '0',
                       'topic_id': 1
                     };

      chai.request(server)
      .post('/api/v1/links')
      .send(linkBody)
      .end((err, response) => {
        response.should.have.status(201);
        response.should.be.json;
        response.body.should.have.property('id');
        response.body.id.should.equal(5);
        done();
      });
    });

    it('should not add a new link if missing a parameter', () => {
      const badLink = { link_title: 'StackOverflow',
                        long_link: 'http://www.stackoverflow.com',
                        click_count: '0',
                        topic_id: 1
                      };

      chai.request(server)
      .post('api/v1/links')
      .send(badLink)
      .end((err, response) => {
        response.should.have.status(422);
        response.body.error.should.equal('Expected format: { name: <String>}. You are missing the name property.');
        done();
      });
    });
  });

  describe('PUT /api/v1/links/clickCountIncr', () => {
    it('should increment click count for given shortLink param', done => {
      chai.request(server)
      .put('/api/v1/links/clickCountIncr')
      .send({
        shortLinkText: 'jet.fuel/5ZvQv',
        clickCount: 9
      })
      .end((err, response) => {
        response.should.have.status(201)
        response.body.should.be.a('object')
        response.body.response.should.equal('click_count successfully incremented')
        chai.request(server)
        .get('/api/v1/links')
        .end((err, response) => {
          const googleLink = response.body.find(link => link.link_title === 'the google');

          googleLink.click_count.should.equal(10)
          done()
        });
      });
    });
  });
});
