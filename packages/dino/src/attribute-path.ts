const LEFT_BRACKET = '[';
const RIGHT_BRACKET = ']';
const PATH_DELIMITER = '.';
const ESCAPE_CHARACTER = '\\';

const enum State {
  ControlCharacter = 1000,
  PathIdentifier,
  PathListIndex,
}

export interface PathIdentifier {
  name: string;
}

export interface PathListIndex {
  index: number;
}

export type PathElement = PathIdentifier | PathListIndex;

export class AttributePath {
  /**
   * The attribute path elements.
   */
  public readonly elements: PathElement[];

  /**
   * Convert a string to path elements.
   */
  static parse(path: string): PathElement[] {
    const elements: PathElement[] = [];

    let state: State = State.PathIdentifier;
    let collected = '';

    for (
      let iter = path[Symbol.iterator](),
        current = iter.next(),
        peek = iter.next();
      current.done === false;
      current = peek, peek = iter.next()
    ) {
      if (state === State.PathIdentifier) {
        switch (current.value) {
          case LEFT_BRACKET:
            state = State.PathListIndex;
          case PATH_DELIMITER:
            if (collected === '') {
              throw new Error(
                `Invalid control character encountered in path: ${path}`
              );
            }
            elements.push({ name: collected });
            collected = '';
            break;
          case ESCAPE_CHARACTER:
            if (
              peek.value === PATH_DELIMITER ||
              peek.value === LEFT_BRACKET ||
              peek.value === ESCAPE_CHARACTER
            ) {
              current = peek;
              peek = iter.next();
            }
          default:
            collected += current.value;
        }
      } else if (state === State.PathListIndex) {
        switch (current.value) {
          case RIGHT_BRACKET:
            const value = Number.parseInt(collected);

            if (!Number.isFinite(value)) {
              throw new TypeError(
                `Invalid array index (${collected}) encountered in path: ${path}`
              );
            }

            elements.push({ index: value });
            collected = '';
            state = State.ControlCharacter;
            break;
          case '0':
          case '1':
          case '2':
          case '3':
          case '4':
          case '5':
          case '6':
          case '7':
          case '8':
          case '9':
            collected += current.value;
            break;
          default:
            throw new Error(
              `Invalid array index character (${current.value}) encountered in path: ${path}`
            );
        }
      } else {
        switch (current.value) {
          case LEFT_BRACKET:
            state = State.PathListIndex;
            break;
          case PATH_DELIMITER:
            state = State.PathIdentifier;
            break;
          default:
            throw new Error(
              `Bare identifier encountered between list index accesses in path: ${path}`
            );
        }
      }
    }

    if (collected.length > 0) {
      elements.push({ name: collected });
    }

    return elements;
  }

  /**
   * Wrap the given path in an attribute path.
   */
  static wrap(path: AttributePath | string): AttributePath {
    if (path instanceof AttributePath) {
      return path;
    }

    return new AttributePath(path);
  }

  /**
   * Create a new attribute path.
   */
  constructor(path: string) {
    this.elements = AttributePath.parse(path);
  }
}
