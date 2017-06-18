==========
Change log
==========
All notable changes to this project will be documented in this file. The format
is based on `Keep a Changelog`_ and this project
adheres to `Semantic Versioning`_.

.. _`Keep a Changelog`: http://keepachangelog.com/
.. _`Semantic Versioning`: http://semver.org/


2.0.8 - 2017-06-19
------------------

Added
~~~~~
  * Support Django 1.11 and Python 3.6.

Fixed
~~~~~
  * Fix error displaying photo list for places.
  * Rewrite tests.
  * Some minor bug fixes.

2.0.7 - 2017-04-01
------------------

  * Fix duplicate results for some searches.
  * Fix problems with Django admin.
  * Add support for token authentication.
  * Remove legacy and broken south migrations.

2.0.6 - 2017-03-27
------------------

  * Drop Django 1.7 support.
  * Drop Python 3.3 support.
  * Add Django 1.10 support.
  * Rewrite lots of typescript.
  * Fix many bugs.
  * Rename ``spud.wsgi`` to ``wsgi.py``.

2.0.5 - 2016-05-01
------------------

  * Various bug fixes.

2.0.4 - 2016-04-25
------------------

  * New release with fixed MANIFEST.in

2.0.3 - 2016-04-25
------------------

  * Port Javascript to Typescript.
  * Add more tests.
  * Remove pipeline TypescriptCompiler - has problems with debugging.
  * Split out Debian packaging.

2.0.2 - 2015-08-09
------------------

  * Work around django-pipeline/slimit js curruption.
  * Change default url prefix.
  * Add support for CORS.
  * Fix new PEP8 issues.

2.0.1 - 2015-04-12
------------------

  * Numerous bugs fixed.

2.0.0 - 2015-03-16
------------------

  * New release.
  * Rewritten code with django-rest-framework.

1.14 - 2014-11-05
-----------------

  * Python 3 fixes.
  * Django 1.7 fixes.

1.13 - 2013-11-05
-----------------

  * Fix various bugs.

1.12 - 2013-08-05
-----------------

  * Fix various bugs.

1.11 - 2013-06-01
-----------------

  * Various bug fixes.

1.10 - 2013-05-15
-----------------

  * Improvements for video.
  * Various bug fixes.

1.9 - 2013-05-12
----------------

  * Various updates for video support.

1.8 - 2013-05-12
----------------

  * Various bug fixes.
  * Improve quality for video support.

1.7 - 2013-05-11
----------------

  * Preliminary support for video files.

1.6 - 2013-05-09
----------------

  * Transition to dh_python2. See
    http://wiki.debian.org/Python/TransitionToDHPython2.
  * Add recommends for dcraw.

1.6 - 2013-05-06
----------------

  * More bug fixes.

1.5 - 2013-05-04
----------------

  * Bugs fixed.
  * Minor schema change.

1.4 - 2013-05-04
----------------

  * Fullscreen mode.
  * Style changes.
  * Bugs fixed.

1.3 - 2013-05-01
----------------

  * Version 1.2 was missing be5492b897743334a841d923c1377a784cea0d58. Retry.

1.2 - 2013-05-01
----------------

  * Schema updates.
  * Fixes for slideshow mode.

1.1 - 2013-04-30
----------------

  * Various bugs fixed.
  * Improvements to style sheets.

1.0 - 2013-04-28
----------------

  * Major rewrite in AJAX/Javascript.

0.25 - 2012-09-18
-----------------

  * Fix media issues.

0.24 - 2012-09-14
-----------------

  * Use Django 1.3 static file support.
  * Make common commands django management commands.
  * Small SQL optimizations.

0.23 - 2012-05-05
-----------------

  * Bugs fixed.
  * Automatically change filename if it conflicts and photo is different.
  * Search for photos based on id.

0.22 - 2012-03-28
-----------------

  * Bugs fixed.
  * Timezone tracking updated.
  * Date searches improved.
  * Code restructured.

0.21 - 2012-03-09
-----------------

  * Update to support at least django-tables 0.9.4
  * Other issues fixed.

0.20 - 2011-12-29
-----------------

  * Improve formatting of AJAX lists.
  * Disable auth checks in AJAX lookups.
  * Exclude deleted photos from being cover photo.

0.19 - 2011-12-28
-----------------

  * Bug fixes.
  * Support django-ajax-select 1.2.3.

0.18 - 2011-07-15
-----------------

  * Improve Javascript.
  * Improve other stuff.

0.17 - 2011-07-08
-----------------

  * Fix various broken things.

0.16 - 2011-07-03
-----------------

  * Update style.
  * Improve Javascript code.
  * Convert floats to inline-blocks.
  * Fix error conditions.

0.15 - 2011-06-30
-----------------

  * Store image sizes in database.
  * Fix quirks in user interface. e.g. image resized after it is displayed.

0.14 - 2011-06-29
-----------------

  * Experimental changes designed to improve mobile phone experience.

0.13 - 2011-06-24
-----------------

  * Fix error templates.

0.12 - 2011-06-23
-----------------

  * Update standards version to 3.9.2.
  * Fix XHTML Errors.
  * Split django-webs stuff into separate package.

0.11 - 2011-05-03
-----------------

  * Remove whitespace after edit photo command.
  * New edit form.
  * Don't hardcode large image size.
  * Fix processing of actions.
  * Fix various issues surrounding photo relations.

0.10 - 2011-04-30
-----------------

  * Remove obsolete command line option to import program.
  * Various bugs fixed.
  * Don't hard code image size or photos per page anywhere. Except for "large".
  * Allow customization of default settings.
  * Improve stylesheet for Mobile phone use.
  * Fix error with migrations on sqlite.

0.9 - 2011-04-26
----------------

  * Improve JavaScript.
  * Rename database tables.

0.8 - 2011-04-24
----------------

  * Fix permission checks. Security issue, anybody could edit photos.
  * Fix broken XHTML.
  * Make timezones more flexible. Can specify UTC+nn or UTC-nn for imports.
  * Improve photo editor, have links to most popular items.
  * Fix problems with add person and set person logic.
  * Limit width of photo summary in css.
  * Optimize how search string is generated.
  * Don't use CSRF protection for post requests that don't have side effects.

0.7 - 2011-04-05
----------------

  * Fix error when accessing non-existant images.
  * Work around innodb bug, see http://south.aeracode.org/ticket/466.
  * Fiddle with stylesheets, etc.

0.6 - 2011-04-04
----------------

  * Use secure session cookies by default.
  * Add missing error templates.
  * Other minor changes.

0.5 - 2011-04-04
----------------

  * Fix typo that caused error when adding category to image.
  * Updates to templates. Good? Bad?
  * Edit now supports showing image in different sizes.

0.4 - 2011-04-02
----------------

  * Enable sql transaction support by default.
  * Add ability to override src timezone and offset on per camera basis.
  * Fix errors when display photos using redirect urls.
  * Fix errors in breadcrumbs for creating albums,categories and places.
  * Add extended abilities for large image photos.

0.3 - 2011-03-02
----------------

  * Add missing depends on python-pyparsing and python-imaging.
  * Add suggests on python-mysqldb.
  * Add spud_process_actions binary to package.

0.2 - 2010-10-19
----------------

  * Fix postinst script.
  * Remove obsolete fastcgi stuff.
  * Turn on following symlinks under media directory.
  * Many bugs removed to a better place.

0.1 - 2010-07-17
----------------

  * Initial release.
