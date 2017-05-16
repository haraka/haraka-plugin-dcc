[![Build Status][ci-img]][ci-url]
[![Code Climate][clim-img]][clim-url]
[![Greenkeeper badge][gk-img]][gk-url]
[![NPM][npm-img]][npm-url]
<!-- requires URL update [![Windows Build Status][ci-win-img]][ci-win-url] -->
<!-- doesn't work in haraka plugins... yet. [![Code Coverage][cov-img]][cov-url]-->

# haraka-plugin-dcc

Clone me, to create a new plugin!

# Template Instructions

These instructions will not self-destruct after use. Use and destroy.

See also, [How to Write a Plugin](https://github.com/haraka/Haraka/wiki/Write-a-Plugin) and [Plugins.md](https://github.com/haraka/Haraka/blob/master/docs/Plugins.md) for additional plugin writing information.

## Create a new repo for your plugin

Haraka plugins are named like `haraka-plugin-something`. All the namespace after `haraka-plugin-` is yours for the taking. Please check the [Plugins]() page and a Google search to see what plugins already exist.

Once you've settled on a name, create the GitHub repo. On the repo's main page, click the _Clone or download_ button and copy the URL. Then paste that URL into a local ENV variable with a command like this:

```sh
export MY_GITHUB_ORG=haraka
export MY_PLUGIN_NAME=haraka-plugin-SOMETHING
```

Clone and rename the dcc repo:

```sh
git clone git@github.com:haraka/haraka-plugin-dcc.git
mv haraka-plugin-dcc $MY_PLUGIN_NAME
cd $MY_PLUGIN_NAME
git remote rm origin
git remote add origin "git@github.com:$MY_GITHUB_ORG/$MY_PLUGIN_NAME.git"
```

Now you'll have a local git repo to begin authoring your plugin

## rename boilerplate

Replaces all uses of the word `dcc` with your plugin's name.

./redress.sh [something]

You'll then be prompted to update package.json and then force push this repo onto the GitHub repo you've created earlier.


## Enable Travis-CI testing

- [ ] visit your [Travis-CI profile page](https://travis-ci.org/profile) and enable Continuous Integration testing on the repo
- [ ] enable Code Climate. Click the _code climate_ badge and import your repo.



# Add your content here

## INSTALL

```sh
cd /path/to/local/haraka
npm install haraka-plugin-dcc
echo "dcc" >> config/plugins
service haraka restart
```

### Configuration

If the default configuration is not sufficient, copy the config file from the distribution into your haraka config dir and then modify it:

```sh
cp node_modules/haraka-plugin-dcc/config/dcc.ini config/dcc.ini
$EDITOR config/dcc.ini
```

## USAGE


<!-- leave these buried at the bottom of the document -->
[ci-img]: https://travis-ci.org/haraka/haraka-plugin-dcc.svg
[ci-url]: https://travis-ci.org/haraka/haraka-plugin-dcc
[ci-win-img]: https://ci.appveyor.com/api/projects/status/CHANGETHIS?svg=true
[ci-win-url]: https://ci.appveyor.com/project/haraka/haraka-CHANGETHIS
[cov-img]: https://codecov.io/github/haraka/haraka-plugin-dcc/coverage.svg
[cov-url]: https://codecov.io/github/haraka/haraka-plugin-dcc
[clim-img]: https://codeclimate.com/github/haraka/haraka-plugin-dcc/badges/gpa.svg
[clim-url]: https://codeclimate.com/github/haraka/haraka-plugin-dcc
[gk-img]: https://badges.greenkeeper.io/haraka/haraka-plugin-dcc.svg
[gk-url]: https://greenkeeper.io/
[npm-img]: https://nodei.co/npm/haraka-plugin-dcc.png
[npm-url]: https://www.npmjs.com/package/haraka-plugin-dcc
