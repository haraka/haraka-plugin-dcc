# haraka-plugin-dcc

[![Test][ci-img]][ci-url] [![Cover][cov-img]][cov-url] [![Qlty][qlty-img]][qlty-url]

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

[ci-img]: https://github.com/haraka/haraka-plugin-dcc/actions/workflows/ci.yml/badge.svg
[ci-url]: https://github.com/haraka/haraka-plugin-dcc/actions/workflows/ci.yml
[cov-img]: https://codecov.io/github/haraka/haraka-plugin-dcc/coverage.svg
[cov-url]: https://codecov.io/github/haraka/haraka-plugin-dcc
[qlty-img]: https://qlty.sh/gh/haraka/projects/haraka-plugin-dcc/maintainability.svg
[qlty-url]: https://qlty.sh/gh/haraka/projects/haraka-plugin-dcc
