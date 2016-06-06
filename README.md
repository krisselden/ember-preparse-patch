# ember-preparse-patch

This is a rebuild of the ember build, that compiles out the require and eager loads modules required right away and moves modules not required to the top level so the V8 preparse will skip them.

Built with [broccoli-ember-preparse](https://github.com/asakusuma/broccoli-ember-preparse)
