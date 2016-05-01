Release 2.0.5 (01 May 2016)
===========================

  * Various bug fixes.

Release 2.0.4 (25 Apr 2016)
===========================

  * New release with fixed MANIFEST.in

Release 2.0.3 (25 Apr 2016)
===========================

  * Port Javascript to Typescript.
  * Add more tests.
  * Remove pipeline TypescriptCompiler - has problems with debugging.
  * Split out Debian packaging.

Release 2.0.2 (09 Aug 2015)
===========================

  * Work around django-pipeline/slimit js curruption.
  * Change default url prefix.
  * Add support for CORS.
  * Fix new PEP8 issues.

Release 2.0.1 (12 Apr 2015)
===========================

  * Numerous bugs fixed.

Release 2.0.0 (16 Mar 2015)
===========================

  * New release.
  * Rewritten code with django-rest-framework.

Release 1.14 (05 Nov 2014)
==========================

  * Python 3 fixes.
  * Django 1.7 fixes.

Release 1.13 (05 Nov 2013)
==========================

  * Fix various bugs.

Release 1.12 (05 Aug 2013)
==========================

  * Fix various bugs.

Release 1.11 (01 Jun 2013)
==========================

  * Various bug fixes.

Release 1.10 (15 May 2013)
==========================

  * Improvements for video.
  * Various bug fixes.

Release 1.9 (12 May 2013)
=========================

  * Various updates for video support.

Release 1.8 (12 May 2013)
=========================

  * Various bug fixes.
  * Improve quality for video support.

Release 1.7 (11 May 2013)
=========================

  * Preliminary support for video files.

Release 1.6 (09 May 2013)
=========================

  * Transition to dh_python2. See
    http://wiki.debian.org/Python/TransitionToDHPython2.
  * Add recommends for dcraw.

Release 1.6 (06 May 2013)
===========================

  * More bug fixes.

Release 1.5 (04 May 2013)
=========================

  * Bugs fixed.
  * Minor schema change.

Release 1.4 (04 May 2013)
=========================

  * Fullscreen mode.
  * Style changes.
  * Bugs fixed.

Release 1.3 (01 May 2013)
=========================

  * Version 1.2 was missing be5492b897743334a841d923c1377a784cea0d58. Retry.

Release 1.2 (01 May 2013)
=========================

  * Schema updates.
  * Fixes for slideshow mode.

Release 1.1 (30 Apr 2013)
=========================

  * Various bugs fixed.
  * Improvements to style sheets.

Release 1.0 (28 Apr 2013)
=========================

  * Major rewrite in AJAX/Javascript.

Release 0.25 (18 Sep 2012)
==========================

  * Fix media issues.

Release 0.24 (14 Sep 2012)
==========================

  * Use Django 1.3 static file support.
  * Make common commands django management commands.
  * Small SQL optimizations.

Release 0.23 (05 May 2012)
==========================

  * Bugs fixed.
  * Automatically change filename if it conflicts and photo is different.
  * Search for photos based on id.

Release 0.22 (28 Mar 2012)
==========================

  * Bugs fixed.
  * Timezone tracking updated.
  * Date searches improved.
  * Code restructured.

Release 0.21 (09 Mar 2012)
==========================

  * Update to support at least django-tables 0.9.4
  * Other issues fixed.

Release 0.20 (29 Dec 2011)
==========================

  * Improve formatting of AJAX lists.
  * Disable auth checks in AJAX lookups.
  * Exclude deleted photos from being cover photo.

Release 0.19 (28 Dec 2011)
==========================

  * Bug fixes.
  * Support django-ajax-select 1.2.3.

Release 0.18 (15 Jul 2011)
=========================

  * Improve Javascript.
  * Improve other stuff.

Release 0.17 (08 Jul 2011)
==========================

  * Fix various broken things.

Release 0.16 (03 Jul 2011)
==========================

  * Update style.
  * Improve Javascript code.
  * Convert floats to inline-blocks.
  * Fix error conditions.

Release 0.15 (30 Jun 2011)
==========================

  * Store image sizes in database.
  * Fix quirks in user interface. e.g. image resized after it is displayed.

Release 0.14 (29 Jun 2011)
==========================

  * Experimental changes designed to improve mobile phone experience.

Release 0.13 (24 Jun 2011)
==========================

  * Fix error templates.

Release 0.12 (23 Jun 2011)
==========================

  * Update standards version to 3.9.2.
  * Fix XHTML Errors.
  * Split django-webs stuff into separate package.

Release 0.11 (03 May 2011)
==========================

  * Remove whitespace after edit photo command.
  * New edit form.
  * Don't hardcode large image size.
  * Fix processing of actions.
  * Fix various issues surrounding photo relations.

Release 0.10 (30 Apr 2011)
==========================

  * Remove obsolete command line option to import program.
  * Various bugs fixed.
  * Don't hard code image size or photos per page anywhere. Except for "large".
  * Allow customization of default settings.
  * Improve stylesheet for Mobile phone use.
  * Fix error with migrations on sqlite.

Release 0.9 (26 Apr 2011)
=========================

  * Improve JavaScript.
  * Rename database tables.

Release 0.8 (24 Apr 2011)
=========================

  * Fix permission checks. Security issue, anybody could edit photos.
  * Fix broken XHTML.
  * Make timezones more flexible. Can specify UTC+nn or UTC-nn for imports.
  * Improve photo editor, have links to most popular items.
  * Fix problems with add person and set person logic.
  * Limit width of photo summary in css.
  * Optimize how search string is generated.
  * Don't use CSRF protection for post requests that don't have side effects.

Release 0.7 (05 Apr 2011)
=========================

  * Fix error when accessing non-existant images.
  * Work around innodb bug, see http://south.aeracode.org/ticket/466.
  * Fiddle with stylesheets, etc.

Release 0.6 (04 Apr 2011)
=========================

  * Use secure session cookies by default.
  * Add missing error templates.
  * Other minor changes.

Release 0.5 (04 Apr 2011)
=========================

  * Fix typo that caused error when adding category to image.
  * Updates to templates. Good? Bad?
  * Edit now supports showing image in different sizes.

Release 0.4 (02 Apr 2011)
=========================

  * Enable sql transaction support by default.
  * Add ability to override src timezone and offset on per camera basis.
  * Fix errors when display photos using redirect urls.
  * Fix errors in breadcrumbs for creating albums,categories and places.
  * Add extended abilities for large image photos.

Release 0.3 (02 Mar 2011)
=========================

  * Add missing depends on python-pyparsing and python-imaging.
  * Add suggests on python-mysqldb.
  * Add spud_process_actions binary to package.

Release 0.2 (19 Oct 2010)
=========================

  * Fix postinst script.
  * Remove obsolete fastcgi stuff.
  * Turn on following symlinks under media directory.

Release 0.2 (13 Sep 2010)
=========================

  * Many bugs removed to a better place.

Release 0.1 (17 Jul 2010)
=========================

  * Initial release.
