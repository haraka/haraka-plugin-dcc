[![Build Status][ci-img]][ci-url]
[![Windows Build Status][ci-win-img]][ci-win-url]
[![Code Climate][clim-img]][clim-url]
[![Greenkeeper badge][gk-img]][gk-url]
[![NPM][npm-img]][npm-url]

# haraka-plugin-dcc

The Distributed Checksum Clearinghouses or DCC is an anti-spam content filter.
See http://www.dcc-servers.net/dcc/ for details of how it works.

This plugin implements the protocol used by the dccifd daemon to communicate
with DCC.

It requires the dccifd daemon running and expects the dccifd socket to be at
/var/dcc/dccifd. To connect to a TCP host:port, edit dcc.ini.

Currently it only reports results.

You can report spam to DCC during reception by setting:
`connection.transaction.notes.training_mode = 'spam'`


### Configuration

If the default configuration is not sufficient, copy the config file from the distribution into your haraka config dir and then modify it:

```sh
cp node_modules/haraka-plugin-dcc/config/dcc.ini config/dcc.ini
$EDITOR config/dcc.ini
```


<!-- leave these buried at the bottom of the document -->
[ci-img]: https://travis-ci.org/haraka/haraka-plugin-dcc.svg
[ci-url]: https://travis-ci.org/haraka/haraka-plugin-dcc
[ci-win-img]: https://ci.appveyor.com/api/projects/status/m0ema14m4e5vy3al?svg=true
[ci-win-url]: https://ci.appveyor.com/project/haraka/haraka-m0ema14m4e5vy3al
[cov-img]: https://codecov.io/github/haraka/haraka-plugin-dcc/coverage.svg
[cov-url]: https://codecov.io/github/haraka/haraka-plugin-dcc
[clim-img]: https://codeclimate.com/github/haraka/haraka-plugin-dcc/badges/gpa.svg
[clim-url]: https://codeclimate.com/github/haraka/haraka-plugin-dcc
[gk-img]: https://badges.greenkeeper.io/haraka/haraka-plugin-dcc.svg
[gk-url]: https://greenkeeper.io/
[npm-img]: https://nodei.co/npm/haraka-plugin-dcc.png
[npm-url]: https://www.npmjs.com/package/haraka-plugin-dcc


