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
    }
  }

};

module.exports = Routes;
