'use strict'

let SecurityTypes = require('./security_types');

let Routes = {

  home: {
    route: '/'
  },

  login: {
    route: '/login'
  },

  logout: {
    route: '/logout'
  },

  register: {
    route: '/register',
    post: {
      pseudo: {type: SecurityTypes.String},
      password: {type: SecurityTypes.String},
      password_verif: {type: SecurityTypes.String}
    }
  },

  dashboard: {
    route: '/dashboard'
  },

  browse: {
    route: '/browse'
  },

  downloadable: {
    all: {
      route: '/downloadable/all',
      post: {
        ids: {type: SecurityTypes.String}
      }
    },
    view: {
      route: '/downloadable/view/:id',
      url: {
        id: {type: SecurityTypes.String}
      }
    },
    download: {
      route: '/downloadable/download/:id',
      url: {
        id: {type: SecurityTypes.String}
      }
    },
    download_extra: {
      route: '/downloadable/download-extra/:id/:type',
      url: {
        id: {type: SecurityTypes.String}
      }
    },
    rate: {
      route: '/downloadable/rate/:id/:rate',
      url: {
        id: {type: SecurityTypes.String},
        rate: {type: SecurityTypes.Integer, values: ['1', '2', '3', '4', '5']}
      }
    },
    report: {
      route: '/downloadable/report/:id',
      url: {
        id: {type: SecurityTypes.String}
      }
    },
    comment: {
      route: '/downloadable/comment/:id',
      url: {
        id: {type: SecurityTypes.String}
      },
      post: {
        text: {type: SecurityTypes.String}
      }
    },
    tag: {
      route: '/downloadable/tag/:id',
      post: {
        name: {type: SecurityTypes.String}
      }
    }
  },

  upload: {
    route: '/upload',
    post: {
      name: {type: SecurityTypes.String},
      category: {type: SecurityTypes.String}
    }
  },

  data: {
    route: '/data/:category_name/:file_id',
    url: {
      category_name: {type: SecurityTypes.String},
      file_id: {type: SecurityTypes.String},
    }
  },

  users: {
    all: {route: '/users/all'},
    best_rators: {route: '/users/best-rators'},
    best_uploaders: {route: '/users/best-uploaders'}
  },

  admin: {
    home: {
      route: '/admin'
    },
    pending_request: {
      accept: {
        route: '/admin/pending-request/accept/:id',
        url: {
          id: {type: SecurityTypes.String}
        }
      },
      refuse: {
        route: '/admin/pending-request/refuse/:id',
        url: {
          id: {type: SecurityTypes.String}
        }
      }
    },
    create_news: {
      route: '/admin/news/create'
    },
    ban_user: {
      route: '/admin/user/ban',
      post: {
        id: {type: SecurityTypes.String}
      }
    },
    unban_user: {
      route: '/admin/user/unban',
      post: {
        id: {type: SecurityTypes.String}
      }
    },
    download: {
      unreport: {
        route: '/admin/download/unreport/:id',
        url: {
          id: {type: SecurityTypes.String}
        }
      },
      delete: {
        route: '/admin/download/delete/:id',
        url: {
          id: {type: SecurityTypes.String}
        }
      }
    }
  }

};

module.exports = Routes;
