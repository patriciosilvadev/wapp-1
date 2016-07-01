var app = module.exports = require('express')();
var _ = require('lodash');
var xssFilters = require('xss-filters');

var api = require('api');
var fn = require('fn');
var categories = require('categories');
var view = require('view').prefix('site');
var pages = require('apps/site/pages');

var authFilter = fn.filters.authFilter;

var getTrending = fn.data.getTrending;
var getComments = fn.data.getComments;
var addComment = fn.data.addComment;
var getMe = fn.data.getMe;

/**
 * get a list of trending questions
 */
app.get('/trending-questions', function (req, res) {
  var pageNum = _.isUndefined(req.query.page) ? 1 : parseInt(req.query.page);
  var batchSize = 3;
  var offset = (pageNum - 1) * batchSize;


  var categoryId = _.isUndefined(req.query.category) ? categories.list()[0].id : req.query.category;
  var selectedCategory = categories.listAll().filter(function (c) {
    return c.id === categoryId;
  })[0];
  getTrending(selectedCategory.id, 'questions', 3, offset, req.token)
    .then(function (feed) {
      res.render(pages.category.trendingQuestions, {
        feed: feed,
        partials: pages.common
      });
    });
});

/**
 * fetch comments partials
 */
app.get('/:answerId/comments', function (req, res) {
  var answerId = req.params.answerId;
  var page = _.isUndefined(req.query.page) ? 1 : parseInt(req.query.page);
  var offset = req.params.offset;

  getComments(answerId, page, req.token)
    .then(function (comments) {
      res.render(pages.common.comments, {comments: comments});
    });
});

/**
 * add a new comment
 * REQUIRES authFilter
 */
app.post('/:answerId/comments', authFilter, function (req, res) {
  var answerId = req.params.answerId;
  var body = req.body.body;
  console.log('hewrer', req.token);
  addComment(answerId, body, req.token)
    .then(
    function () {
      res.send({msg: 'success'});
    },
    function () {
      res.status(400).send({msg: 'fail'});
    }
  );
});

/**
 * Report Abuse
 * Requires AUTH filter
 */
app.post('/report-abuse', authFilter, function (req, res) {
  console.log(req.body);
  api.post('/reportabuse ', {
    json: {
      object_id: req.body.id,
      object_type: req.body.type,
      reason: 'default'
    },
    token: req.token
  }).then(
    function (data) {
      console.log(data);
      res.send({msg: 'success'});
    },
    function (err) {
      console.log(err);
      res.status(400).send({msg: err});
    }
  );
});


/**
 * increment video
 */
app.post('/view', function (req, res) {
  api.get('/videoview', {
    qs: {url: req.body.vurl},
    token: req.token
  }).then(
    function (data) {
      res.send({msg: 'success'});
    },
    function (err) {
      res.status(400).send({msg: 'failed'});
    }
  );
});


/**
 * ask a question to a user
 * REQUIRES AUTH FILTER
 */
app.post('/ask/:userId', authFilter, function (req, res) {
  if (req.body.question.is_anonymous === 'true') {
    var isAnonymous = 1;
  } else {
    isAnonymous = 0;
  }
  if (req.body.question.widget === 'true') {
    var widgetValue = true;
  } else {
    var widgetValue = false;
  }
  api.post('/question/ask', {
    json: {
      question_to: req.params.userId,
      is_anonymous: isAnonymous,
      body: xssFilters.inHTMLData(req.body.question.body),
    },
    token: req.token,
    widget: widgetValue
  }).then(
    function (data) {
      res.send(data);
    },
    function (err) {
      res.status(400).send({msg: 'failed'});
    }
  );
});



/**
 * request answer from a user
 * REQUIRES AUTH FILTER
 */
app.post('/request-answer/:questionId', authFilter, function (req, res) {
  api.post('/question/upvote/' + req.params.questionId, {token: req.token}).then(
    function (data) {
      res.send({msg: 'success'});
    },
    function (err) {
      res.status(400).send({msg: 'failed'});
    }
  );
});

/**
 * downvote/unrequest answer from a user
 * REQUIRES AUTH FILTER
 */
app.post('/downvote-answer/:questionId', authFilter, function (req, res) {
  api.post('/question/downvote/' + req.params.questionId, {token: req.token}).then(
    function (data) {
      res.send({msg: 'success'});
    },
    function (err) {
      res.status(400).send({msg: 'failed'});
    }
  );
});

/**
 * follow/unfollow a user
 * REQUIRES AUTH FILTER
 * params - userId
 */
app.post('/follow/:userId', authFilter, function (req, res) {
  api.post('/user/follow', {
    json: {user_id: req.params.userId},
    token: req.token
  }).then(
    function (data) {
      res.send({msg: 'success'});
    },
    function (res) {
      res.status(400).send({msg: 'failed'});
    }
  );
});

/**
 * reset password
 * Requires - forgotPasswordTokenFilter*
 * Params - password
 * */
app.post('/reset-password', function (req, res) {
  api.post('/forgotpassword/reset/' + req.body.resetToken, {
    json: {password: req.body.password},

  }).then(
    function (data) {
      res.send({msg: 'success'});
      console.log(data);
    },
    function (res) {
      console.log(res);
      res.status(400).send({msg: 'failed'});
    }
  );
});

/**
 * Unfollow user
 * requires - authfilter
 * params - userId
 */
app.post('/unfollow/:userId', authFilter, function (req, res) {
  api.post('/user/unfollow', {
    json: {user_id: req.params.userId},
    token: req.token
  }).then(
    function (data) {
      res.send({msg: 'success'});
    },
    function (err) {
      res.status(400).send({msg: 'failed'});
    }
  );
});

/**
 * like/unlike answer
 * REQUIRES AUTH FILTER
 */
app.post('/like/:answerId', authFilter, function (req, res) {
  api.post('/post/like', {
    json: {post_id: req.params.answerId},
    token: req.token
  }).then(
    function (data) {
      res.send({msg: 'success'});
    },
    function (err) {
      res.status(400).send({msg: 'failed'});
    }
  );

});

/**
 * Unlike Answers
 * requires - authFilter
 * params - answerId
 */

app.post('/unlike/:answerId', authFilter, function (req, res) {
  api.post('/post/unlike', {
    json: {post_id: req.params.answerId},
    token: req.token
  }).then(
    function (data) {
      res.send({msg: 'success'});
    },
    function (data) {
      res.status(400).send({msg: 'failed'});
    }
  );
});

/**
 * Get User feeds
 * requires - NA
 * params - userId
 */
app.get('/:user_id/feeds', function (req, res) {
  api.get('/timeline/user/' + req.params.user_id + '/multitype').then(
    function (data) {
      res.send(data);
    },
    function (data) {
      res.status(400).send({msg: 'failed'});
    }
  );
});

//routes to be used in shareCard after recording

/**
 * Get User profile details
 * requires - NA
 * params - NA
 */
app.get('/user/profile/', authFilter, function (req, res) {
  getMe(req.token).then(
    function (data) {
      res.send(data);
    },
    function (error) {
      res.status(400).send({msg: 'failed'});
    }
  );

});

/*
 *Post on fb, twitter and youtube
 *requires - NA
 *params -NA
 */

app.post('/social/post', authFilter, function (req, res) {
  api.post('/user/post_permission',
    {
      json: req.body,
      token: req.token
    }).then(function (data) {
      res.send({msg: " posted"});
    },
    function (error) {
      res.status(400).send({msg: 'post failed'});
    });

});





