This document is about the Qbix Platform, by Gregory Magarshak

DESIGN GOALS
------------

Qbix offers a number of advantages over other frameworks, or not using any frameworks at all. Its design goals include:
  * Code Re-Use ... build apps out of plugins and tools; make it easy to turn new development into a plugin
  * Don't Repeat Yourself ... one place to modify or handle things; applies to config, schemas, etc.
  * Consistent ... file locations; coding style; APIs; documentation; user accounts and interface;
  * Easy To Learn ... stays close to PHP and JS; simple naming; straightforward implementation for each feature; complex systems must build on simple ones
  * Scalable ... encourage distributed design; as a fallback, encourage efficient use of centralized resources like database
  * Responsive ... executes requests to app with minimal overhead; load things on demand despite size of codebase; built-in batching and caching tools
  * Extensible ... allow import of other code, such as the Zend Framework; everything is namespaced and can live alongside each other
  * Team Oriented ... supports division of labor; works well with version control systems; encourage keeping credentials private; continuous integration and testing
  * Portable ... easily deploy apps on various environments; development environments and clients; easily handle versions and dependencies; works across platforms

TECHNOLOGY STACK
----------------
Operating System: Linux (also can run on BSD, MacOS or Windows)
Web Server:       NGinX 1.0+ (also can use Apache 1.2+).
Database System:  MySQL 5+ (or MariaDB, support for other DBMS possible soon)
Core:             PHP 5.3+ (but PHP 7 recommended for better speed and security)
Services:         Node.js 4.0+ (Optional, but highly recommended e.g. for sending out notifications)
Front end:        Cordova (also can use PhoneGap)
Recommended:      Linux + NGinX + PHP-FPM + Node.js + Cordova