'use strict';

exports.register = function () {
    let plugin = this;
    plugin.load_dcc_ini();
}

exports.load_dcc_ini = function () {
    let plugin = this;

    plugin.cfg = plugin.config.get('dcc.ini', {
        booleans: [
            '+enabled',               // plugins.cfg.main.enabled=true
            '-disabled',              // plugins.cfg.main.disabled=false
            '+feature_section.yes'    // plugins.cfg.feature_section.yes=true
        ]
    },
    function () {
        plugin.load_example_ini();
    });
}
