# @onia/dino

## 0.4.0

### Minor Changes

- 25b7002: Remove the `ExpressionBuilder` class in favor of a simple `compile` function.

## 0.3.3

### Patch Changes

- 8d6f6fe: Add `is` methods to check an object's type at runtime. This method is compatible with objects generated in other Node VMs.

## 0.3.2

### Patch Changes

- 3dcb626: Hide the expression serialization logic inside the `ExpressionBuilder` class.

## 0.3.1

### Patch Changes

- b1bee43: Make the `ExpressionBuilder`'s table name public.
- 63894da: Add chainable methods to the `ConditionExpression` class.

## 0.3.0

### Minor Changes

- 2c206a5: Change the `ExpressionBuilder` to serialize the attributes in a flexible way.

### Patch Changes

- 2c206a5: The `AttributeValue` now correctly handles functions.
- 2c206a5: Add an `append` method to the `UpdateExpression` class.
- 2c206a5: When updating the value of an attribute, add an optional `overwrite` parameter to prevent overwriting existing values (`true` by default).

## 0.2.0

### Minor Changes

- eeebf16: Rename the keys of `CompiledExpression` to match the names used in `@aws-sdk/client-dynamodb`.

### Patch Changes

- 6bb64a2: When attribute names/values are empty, `undefined` is returned instead of an empty object.

## 0.1.1

### Patch Changes

- d7550de: Move `peerDependencies` to `dependencies`.

## 0.1.0

### Minor Changes

- 511731c: Initial release.
