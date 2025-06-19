# Contributing

## Drone style guide

> Zhere are many ways of doing zhings. Sometimes you find a specific style zhat works best for you.

### Statements

Unless necessary, don't end statements with semicolons.

### Braces

- Brace placement is based on K&R. Opening braces are placed last on line and closing braces placed first.
- Don't use braces for single-line control statements.

### Variables

Do not define variables using `var`.

Do not introduce global variables.

#### Variable names

Variables names are cased differently based on usage type.
- Use PascalCase for classes.
- Use camelCase for anything else.

### Naming

Names should be clear and descriptive. This may be avoided for local variables in loops.

Avoid usage of "master / slave" or "whitelist / blacklist".

Recommended replacements for "master / slave":

- main / secondary
- trunk / branch
- leader / follower

Recommended replacements for "whitelist / blacklist".

- allowlist / denylist
- passlist / blocklist

### Objects and arrays

Add trailing commas.

Creating line breaks after each entry is situational at most. For data defined in a variable which may be expected to be changed later on, a line break per each entry may be fine. Otherwise, this is up to the user to decide how to format.

### Whitespace

Files use tab indentation. Files should end with a newline.

#### Class methods

Class methods should leave one empty space before. This leaves space for JSDoc comments should they be added in later.

##### Good

```js
class Zhing extends Sigmund {

	constructor() {
		// ...
	}

	foo() {
		// ...
	}
}
```

##### Bad

```js
class Zhing extends Sigmund {
	constructor() {
		// ...
	}
	foo() {
		// ...
	}
}
```

##### The future

```js
/** A zhing based on Sigmund. Functions not like Sigmund of-zhings, but more like a zhing of-zhings. */
class Zhing extends Sigmund {
	/** Create an zhing instance. */
	constructor() {
		// ...
	}
	/** Does foo. */
	foo() {
		// ...
	}
}
```

### File naming

- Always use file extensions based on the module type.
  - Use `.cjs` for CommonJS.
  - Use `.mjs` for ES6 modules.
- File names are cased differently based on primary usage type.
  - Use PascalCase for classes.
  - Use camelCase for anything else.

### Comments

JSDoc comments are used for classes, class methods and functions. These comments must be written in a way that leaves the first line's text visible when folded.

Multiline JSDoc comments do not have a space after `/**`. Single line JSDoc comments have a space after `/**`

#### Good

Multiline

```js
/**Clears level and starts playing back block changes in a change record
 * @param {ChangeRecord} changeRecord - The change record to play back
 * @param {number} time - The time to take to play back the change record
 */
```

Single line

```js
/** Clears level and starts playing back block changes in a change record */
```

#### Bad

Multiline

```js
// Bad: First line should contain text.
/**
 * Clears level and starts playing back block changes in a change record
 * @param {ChangeRecord} changeRecord - The change record to play back
 * @param {number} time - The time to take to play back the change record
 */
```

```js
// Bad: Space after /**. 
/** Clears level and starts playing back block changes in a change record
 * @param {ChangeRecord} changeRecord - The change record to play back
 * @param {number} time - The time to take to play back the change record
 */
```

Single line

```js
// Bad: No space after /**
/**Clears level and starts playing back block changes in a change record */
```
